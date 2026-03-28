import { prisma } from '../../db/prisma';
import { createOrder as createRetailCrmOrder } from '../../integrations/retailcrm/client';
import { createPaymentFormData, getCheckoutUrl } from '../../integrations/liqpay/client';
import { setIdempotencyResult } from '../../security/idempotency';
import { sendGA4Event } from '../../integrations/ga4/client';
import { logger } from '../../security/logger';
import { env } from '../../config/env';
import crypto from 'crypto';
import type { CheckoutRequest } from '../../validation/checkout.schema';

export interface CheckoutResult {
    orderId: string;
    orderNumber: string;
    retailcrmOrderId: string | null;
    status: string;
    payment: {
        type: 'online' | 'cod';
        paymentUrl?: string;
    };
}

/**
 * Full checkout orchestration:
 * 1. Load & validate quote
 * 2. Verify prices haven't expired
 * 3. Create order in RetailCRM
 * 4. Create local order record
 * 5. Create LiqPay payment (if online) or mark as COD
 * 6. Store idempotency result
 * 7. Fire GA4 purchase event
 */
export async function processCheckout(
    input: CheckoutRequest,
    idempotencyKey: string,
): Promise<CheckoutResult> {
    // 1. Load quote
    const quote = await prisma.quote.findUnique({
        where: { id: input.quoteId },
        include: { bundle: true },
    });

    if (!quote) {
        throw Object.assign(new Error('Quote not found'), { statusCode: 404 });
    }

    if (quote.status !== 'ACTIVE') {
        throw Object.assign(new Error('Quote already used or expired'), { statusCode: 410 });
    }

    if (new Date() > quote.expiresAt) {
        // Mark as expired
        await prisma.quote.update({ where: { id: quote.id }, data: { status: 'EXPIRED' } });
        throw Object.assign(new Error('Quote has expired. Please recalculate.'), { statusCode: 410 });
    }

    // 2. Extract snapshot data
    const itemsSnapshot = quote.itemsSnapshot as any[];
    const totalsSnapshot = quote.totalsSnapshot as { subtotal: number; total: number };

    // 2.5 Generate unique 8-digit order number from UUID
    const orderId = crypto.randomUUID();
    const hash = crypto.createHash('sha256').update(orderId).digest('hex');
    const num = parseInt(hash.substring(0, 10), 16);
    const shortId = (num % 100000000).toString().padStart(8, '0');

    // 3. Create order in RetailCRM
    let retailcrmOrderId: string | null = null;
    try {
        let deliveryCode = env.CRM_DELIVERY_TYPE_NP || 'nova-poshta';
        let addressData: any = {};

        if (input.delivery.type === 'pickup') {
            deliveryCode = env.CRM_DELIVERY_TYPE_PICKUP || 'self-delivery';
        } else if (input.delivery.type === 'courier') {
            deliveryCode = env.CRM_DELIVERY_TYPE_COURIER || 'courier';
            addressData = {
                city: input.delivery.city,
                street: input.delivery.street,
                building: input.delivery.house,
                block: input.delivery.entrance || undefined,
                flat: input.delivery.apartment || undefined,
            };
        } else if (input.delivery.type === 'nova_poshta') {
            deliveryCode = env.CRM_DELIVERY_TYPE_NP || 'nova-poshta';
            addressData = {
                city: input.delivery.cityName,
                // Passing warehouse as street allows the CRM to parse them cleanly into two separate inputs
                street: input.delivery.warehouseName,
            };
        }

        let customerComment: string | undefined = undefined;
        if (input.paymentMethod === 'cashless' && input.customer.companyName && input.customer.edrpou) {
            customerComment = `Увага, замовлення за безготівковим розрахунком\nНазва організації: ${input.customer.companyName}\nКод ЄДРПОУ: ${input.customer.edrpou}`;
        }

        let paymentType = env.CRM_PAYMENT_TYPE_COD || 'cash-on-delivery';
        if (input.paymentMethod === 'online') {
            paymentType = env.CRM_PAYMENT_TYPE_ONLINE || 'liqpay';
        } else if (input.paymentMethod === 'cashless') {
            paymentType = env.CRM_PAYMENT_TYPE_CASHLESS || 'bank-transfer';
        }

        const rcResult = await createRetailCrmOrder({
            ...(env.CRM_SITE_CODE ? { site: env.CRM_SITE_CODE } : {}),
            order: {
                externalId: orderId,
                number: shortId,
                customerComment,
                firstName: input.customer.firstName,
                lastName: input.customer.lastName,
                phone: input.customer.phone,
                email: input.customer.email,
                items: itemsSnapshot.map((item: any, idx: number) => ({
                    externalId: `${orderId}-${idx}`,
                    offer: { externalId: item.offerId },
                    productName: item.name,
                    quantity: item.qty,
                    initialPrice: item.unitPrice,
                    ...(item.priceType ? { priceType: { code: item.priceType } } : {}),
                    properties: [
                        {
                            code: 'row_id',
                            name: 'Рядок кошика',
                            value: `${orderId}-${idx}`
                        },
                        ...(item.bundleId ? [{
                            code: 'bundle_type',
                            name: 'З набору',
                            value: item.bundleId
                        }] : [])
                    ]
                })),
                delivery: {
                    code: deliveryCode,
                    address: Object.keys(addressData).length > 0 ? addressData : undefined,
                },
                paymentType: paymentType,
            },
        });
        retailcrmOrderId = String(rcResult.id);
    } catch (err) {
        logger.error('RetailCRM order creation failed', { error: (err as Error).message });
        // Continue without RetailCRM — we still create a local order
    }

    // 4. Create local order
    const order = await prisma.order.create({
        data: {
            id: orderId,
            quoteId: quote.id,
            retailcrmOrderId,
            customer: input.customer as any,
            delivery: input.delivery as any,
            itemsSnapshot: itemsSnapshot as any,
            total: totalsSnapshot.total,
            paymentMethod: input.paymentMethod === 'online' ? 'ONLINE' : input.paymentMethod === 'cashless' ? 'CASHLESS' : 'COD',
            paymentStatus: input.paymentMethod === 'online' ? 'PENDING' : 'PENDING',
            status: input.paymentMethod === 'online' ? 'AWAITING_PAYMENT' : 'CONFIRMED',
            idempotencyKey,
        },
    });

    // 5. Mark quote as used
    await prisma.quote.update({ where: { id: quote.id }, data: { status: 'USED' } });

    let paymentUrl: string | undefined;
    if (input.paymentMethod === 'online') {
        const host = env.SITE_URL;
        const formData = createPaymentFormData({
            orderId: order.id,
            amount: totalsSnapshot.total,
            currency: 'UAH',
            description: `Замовлення №${shortId}`,
            resultUrl: `${host}/?orderId=${order.id}&orderNumber=${shortId}`,
            serverUrl: `${host}/api/payments/liqpay/callback`,
        });
        paymentUrl = getCheckoutUrl(formData);
    }

    // 7. Build result
    const result: CheckoutResult = {
        orderId: order.id,
        orderNumber: shortId,
        retailcrmOrderId,
        status: order.status,
        payment: {
            type: input.paymentMethod as 'online' | 'cod',
            paymentUrl,
        },
    };

    // 8. Store idempotency result
    await setIdempotencyResult(idempotencyKey, result as any);

    // 9. Fire GA4 purchase event (non-blocking)
    sendGA4Event('server', [
        {
            name: 'purchase',
            params: {
                transaction_id: order.id,
                value: totalsSnapshot.total,
                currency: 'UAH',
                payment_type: input.paymentMethod,
                shipping_tier: input.delivery.type,
                items: itemsSnapshot.map((item: any) => ({
                    item_id: item.offerId,
                    item_name: item.name,
                    price: item.unitPrice,
                    quantity: item.qty,
                })),
            },
        },
    ]).catch(() => { }); // non-blocking

    logger.info('Checkout completed', {
        orderId: order.id,
        paymentMethod: input.paymentMethod,
        total: totalsSnapshot.total,
    });

    return result;
}
