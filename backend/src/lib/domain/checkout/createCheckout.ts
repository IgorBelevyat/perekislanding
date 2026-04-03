import { prisma } from '../../db/prisma';
import { createPaymentFormData, getCheckoutUrl } from '../../integrations/liqpay/client';
import { setIdempotencyResult } from '../../security/idempotency';
import { pushOrderToCrm } from './crmSync';
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

    // 3. Create local order FIRST (so outbox can pick it up if CRM push fails)
    let retailcrmOrderId: string | null = null;

    const order = await prisma.order.create({
        data: {
            id: orderId,
            quoteId: quote.id,
            retailcrmOrderId: null, // Will be set after CRM push
            customer: { ...input.customer, customerExternalId: input.customerExternalId } as any,
            delivery: input.delivery as any,
            itemsSnapshot: itemsSnapshot as any,
            total: totalsSnapshot.total,
            paymentMethod: input.paymentMethod === 'online' ? 'ONLINE' : input.paymentMethod === 'cashless' ? 'CASHLESS' : 'COD',
            paymentStatus: input.paymentMethod === 'online' ? 'PENDING' : 'PENDING',
            status: input.paymentMethod === 'online' ? 'AWAITING_PAYMENT' : 'CONFIRMED',
            idempotencyKey,
        },
    });

    // 4. For COD/cashless — push to CRM immediately.
    //    For online — defer until LiqPay confirms payment.
    //    If CRM push fails, outbox worker will retry automatically.
    if (input.paymentMethod !== 'online') {
        retailcrmOrderId = await pushOrderToCrm(order.id);
    }

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

    logger.info('Checkout completed', {
        orderId: order.id,
        paymentMethod: input.paymentMethod,
        total: totalsSnapshot.total,
    });

    return result;
}
