import { createOrder as createRetailCrmOrder } from '../../integrations/retailcrm/client';
import { prisma } from '../../db/prisma';
import { logger } from '../../security/logger';
import { env } from '../../config/env';
import crypto from 'crypto';

/**
 * Build a CRM-compatible order payload from a local Order record.
 * This is extracted into a shared function so that:
 * 1. createCheckout.ts can use it for immediate COD/cashless pushes
 * 2. payments.ts callback can use it for deferred LiqPay pushes
 * 3. The outbox retry worker can use it for failed retries
 *
 * Eliminates the duplication that previously existed in 2 places.
 */
export function buildCrmPayload(order: {
    id: string;
    customer: any;
    delivery: any;
    itemsSnapshot: any[];
    paymentMethod: string;
    paymentStatus: string;
}) {
    const customer = order.customer;
    const delivery = order.delivery;
    const items = order.itemsSnapshot;

    // Reconstruct short ID from order UUID (deterministic — same algorithm everywhere)
    const hash = crypto.createHash('sha256').update(order.id).digest('hex');
    const num = parseInt(hash.substring(0, 10), 16);
    const shortId = (num % 100000000).toString().padStart(8, '0');

    // Delivery
    let deliveryCode = env.CRM_DELIVERY_TYPE_NP || 'nova-poshta';
    let addressData: any = {};
    let deliveryData: any = null;

    if (delivery.type === 'pickup') {
        deliveryCode = env.CRM_DELIVERY_TYPE_PICKUP || 'self-delivery';
    } else if (delivery.type === 'courier') {
        deliveryCode = env.CRM_DELIVERY_TYPE_COURIER || 'courier';
        addressData = {
            city: delivery.city,
            street: delivery.street,
            building: delivery.house,
            block: delivery.entrance || undefined,
            flat: delivery.apartment || undefined,
        };
    } else if (delivery.type === 'nova_poshta') {
        deliveryCode = env.CRM_DELIVERY_TYPE_NP || 'nova-poshta';
        deliveryData = {
            receiverCity: delivery.cityName,
            receiverCityRef: delivery.cityRef,
            receiverWarehouseTypeRef: delivery.warehouseRef,
        };
    }

    // Customer comment for cashless
    let customerComment: string | undefined = undefined;
    if (order.paymentMethod === 'CASHLESS' && customer.companyName && customer.edrpou) {
        customerComment = `Увага, замовлення за безготівковим розрахунком\nНазва організації: ${customer.companyName}\nКод ЄДРПОУ: ${customer.edrpou}`;
    }

    // Payment type & status
    let paymentType = env.CRM_PAYMENT_TYPE_COD || 'cash-on-delivery';
    let paymentStatus: string | undefined = undefined;

    if (order.paymentMethod === 'ONLINE') {
        paymentType = env.CRM_PAYMENT_TYPE_ONLINE || 'liqpay';
        // If payment is already confirmed, mark as paid; otherwise not-paid
        paymentStatus = order.paymentStatus === 'PAID' ? 'paid' : 'not-paid';
    } else if (order.paymentMethod === 'CASHLESS') {
        paymentType = env.CRM_PAYMENT_TYPE_CASHLESS || 'bank-transfer';
    }

    return {
        ...(env.CRM_SITE_CODE ? { site: env.CRM_SITE_CODE } : {}),
        order: {
            externalId: order.id,
            number: shortId,
            customerComment,
            ...(customer.customerExternalId ? { customer: { externalId: customer.customerExternalId } } : {}),
            firstName: customer.firstName,
            lastName: customer.lastName,
            phone: customer.phone,
            email: customer.email,
            items: items.map((item: any, idx: number) => ({
                externalId: `${order.id}-${idx}`,
                offer: { externalId: item.offerId },
                productName: item.name,
                quantity: item.qty,
                initialPrice: item.unitPrice,
                ...(item.priceType ? { priceType: { code: item.priceType } } : {}),
                properties: [
                    {
                        code: 'row_id',
                        name: 'Рядок кошика',
                        value: `${order.id}-${idx}`,
                    },
                    ...(item.bundleId ? [{
                        code: 'bundle_type',
                        name: 'З набору',
                        value: item.bundleId,
                    }] : []),
                ],
            })),
            delivery: {
                code: deliveryCode,
                ...(Object.keys(addressData).length > 0 ? { address: addressData } : {}),
                ...(deliveryData ? { data: deliveryData } : {}),
            },
            payments: [{
                type: paymentType,
                ...(paymentStatus ? { status: paymentStatus } : {}),
            }],
        },
    };
}

/**
 * Push one order to CRM. Returns the CRM order ID on success, null on failure.
 * Updates the local order record with the CRM ID if successful.
 */
export async function pushOrderToCrm(orderId: string): Promise<string | null> {
    const order = await prisma.order.findUnique({
        where: { id: orderId },
    });

    if (!order) {
        logger.warn('pushOrderToCrm: order not found', { orderId });
        return null;
    }

    // Already pushed
    if (order.retailcrmOrderId) {
        return order.retailcrmOrderId;
    }

    const payload = buildCrmPayload({
        id: order.id,
        customer: order.customer,
        delivery: order.delivery,
        itemsSnapshot: order.itemsSnapshot as any[],
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
    });

    try {
        const rcResult = await createRetailCrmOrder(payload);
        const crmId = String(rcResult.id);

        await prisma.order.update({
            where: { id: orderId },
            data: { retailcrmOrderId: crmId },
        });

        logger.info('CRM order pushed successfully', { orderId, crmId });
        return crmId;
    } catch (err) {
        logger.error('CRM order push failed', { orderId, error: (err as Error).message });
        return null;
    }
}

/**
 * Outbox worker: find all orders that should be in CRM but aren't,
 * and attempt to push them.
 *
 * Eligible orders:
 * - retailcrmOrderId IS NULL (not yet in CRM)
 * - status NOT cancelled
 * - For ONLINE payment: only if paymentStatus = PAID (LiqPay confirmed)
 * - For COD/CASHLESS: always eligible (they should have been pushed at checkout)
 * - Created within the last 7 days (don't retry ancient orders forever)
 */
export async function retryFailedCrmOrders(): Promise<void> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    try {
        const pendingOrders = await prisma.order.findMany({
            where: {
                retailcrmOrderId: null,
                status: { not: 'CANCELLED' },
                createdAt: { gte: sevenDaysAgo },
                // Only push if payment is resolved:
                // - COD/CASHLESS don't need payment confirmation
                // - ONLINE needs PAID status (LiqPay callback confirmed)
                OR: [
                    { paymentMethod: 'COD' },
                    { paymentMethod: 'CASHLESS' },
                    { paymentMethod: 'ONLINE', paymentStatus: 'PAID' },
                ],
            },
            select: { id: true },
            orderBy: { createdAt: 'asc' },
            take: 10, // Process max 10 per cycle to avoid overloading CRM
        });

        if (pendingOrders.length === 0) return;

        logger.info(`CRM outbox: found ${pendingOrders.length} orders to retry`);

        let successCount = 0;
        let failCount = 0;

        for (const { id } of pendingOrders) {
            const result = await pushOrderToCrm(id);
            if (result) {
                successCount++;
            } else {
                failCount++;
            }
            // Small delay between CRM calls to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        logger.info('CRM outbox cycle complete', { successCount, failCount });
    } catch (err) {
        logger.error('CRM outbox worker error', { error: (err as Error).message });
    }
}
