import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { verifySignature, decodeCallbackData, isPaymentSuccessful, isPaymentFailed } from '../lib/integrations/liqpay/verify';
import { prisma } from '../lib/db/prisma';
import { logger } from '../lib/security/logger';

const router = Router();

/**
 * POST /api/payments/liqpay/callback
 * LiqPay sends data + signature after payment completion.
 * CRITICAL: Must verify signature before trusting any data.
 */
router.post(
    '/liqpay/callback',
    asyncHandler(async (req, res) => {
        const { data, signature } = req.body;

        // 1. Validate presence
        if (!data || !signature) {
            logger.warn('LiqPay callback: missing data or signature');
            res.status(400).json({ error: 'Missing data or signature' });
            return;
        }

        // 2. Verify signature — MUST-HAVE
        if (!verifySignature(data, signature)) {
            logger.error('LiqPay callback: invalid signature');
            res.status(403).json({ error: 'Invalid signature' });
            return;
        }

        // 3. Decode callback data
        const callbackData = decodeCallbackData(data);
        const { order_id, amount, status, currency } = callbackData;

        logger.info('LiqPay callback received', {
            orderId: order_id,
            status,
            amount,
            currency,
        });

        // 4. Find order
        const order = await prisma.order.findUnique({
            where: { id: order_id },
        });

        if (!order) {
            logger.error('LiqPay callback: order not found', { orderId: order_id });
            res.status(404).json({ error: 'Order not found' });
            return;
        }

        // 5. Verify amount matches (anti-tampering)
        if (Number(amount) !== Number(order.total)) {
            logger.error('LiqPay callback: amount mismatch', {
                orderId: order_id,
                expectedAmount: Number(order.total),
                receivedAmount: amount,
            });
            res.status(400).json({ error: 'Amount mismatch' });
            return;
        }

        // 6. Idempotent: skip if already processed
        if (order.paymentStatus === 'PAID' || order.paymentStatus === 'FAILED') {
            logger.info('LiqPay callback: already processed', { orderId: order_id, status: order.paymentStatus });
            res.status(200).json({ status: 'already_processed' });
            return;
        }

        // 7. Update payment status
        if (isPaymentSuccessful(status)) {
            await prisma.order.update({
                where: { id: order_id },
                data: {
                    paymentStatus: 'PAID',
                    status: 'CONFIRMED',
                },
            });
            logger.info('Payment confirmed', { orderId: order_id });
        } else if (isPaymentFailed(status)) {
            await prisma.order.update({
                where: { id: order_id },
                data: {
                    paymentStatus: 'FAILED',
                    status: 'CANCELLED',
                },
            });
            logger.warn('Payment failed', { orderId: order_id, liqpayStatus: status });
        } else {
            logger.info('LiqPay callback: intermediate status', { orderId: order_id, status });
        }

        // 8. Log integration
        await prisma.integrationLog.create({
            data: {
                provider: 'LIQPAY',
                action: 'callback',
                requestMeta: { orderId: order_id, status, amount },
                responseMeta: {},
                status: 'SUCCESS',
            },
        }).catch(() => { }); // non-blocking

        // 9. Respond quickly
        res.status(200).json({ status: 'ok' });
    }),
);

export default router;
