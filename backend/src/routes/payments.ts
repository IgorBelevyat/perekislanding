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

            // Push to RetailCRM now that payment is confirmed
            if (!order.retailcrmOrderId) {
                try {
                    const { createOrder: createRetailCrmOrder } = await import('../lib/integrations/retailcrm/client');
                    const { env } = await import('../lib/config/env');

                    const customer = order.customer as any;
                    const delivery = order.delivery as any;
                    const items = order.itemsSnapshot as any[];
                    const orderNum = order.id;

                    // Reconstruct short ID from order UUID (same algorithm as checkout)
                    const crypto = await import('crypto');
                    const hash = crypto.createHash('sha256').update(order.id).digest('hex');
                    const num = parseInt(hash.substring(0, 10), 16);
                    const shortId = (num % 100000000).toString().padStart(8, '0');

                    let deliveryCode = env.CRM_DELIVERY_TYPE_NP || 'nova-poshta';
                    let addressData: any = {};
                    let npDeliveryData: any = null;

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
                        npDeliveryData = {
                            receiverCity: delivery.cityName,
                            receiverCityRef: delivery.cityRef,
                            receiverWarehouseTypeRef: delivery.warehouseRef,
                        };
                    }

                    const paymentType = env.CRM_PAYMENT_TYPE_ONLINE || 'liqpay';

                    const rcResult = await createRetailCrmOrder({
                        ...(env.CRM_SITE_CODE ? { site: env.CRM_SITE_CODE } : {}),
                        order: {
                            externalId: order.id,
                            number: shortId,
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
                            })),
                            delivery: {
                                code: deliveryCode,
                                ...(Object.keys(addressData).length > 0 ? { address: addressData } : {}),
                                ...(npDeliveryData ? { data: npDeliveryData } : {}),
                            },
                            payments: [{
                                type: paymentType,
                                status: 'paid',
                            }],
                        },
                    });

                    await prisma.order.update({
                        where: { id: order_id },
                        data: { retailcrmOrderId: String(rcResult.id) },
                    });
                    logger.info('CRM order created after payment', { orderId: order_id, crmId: rcResult.id });
                } catch (crmErr) {
                    logger.error('CRM order creation after payment failed', { orderId: order_id, error: (crmErr as Error).message });
                }
            }
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

/**
 * GET /api/payments/order/:orderId
 * Frontend checks actual payment status after LiqPay redirect.
 * Returns: { status, paymentStatus, orderNumber }
 */
router.get(
    '/order/:orderId',
    asyncHandler(async (req, res) => {
        const orderId = req.params.orderId as string;

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                status: true,
                paymentStatus: true,
                paymentMethod: true,
                createdAt: true,
            },
        });

        if (!order) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }

        res.json({
            orderId: order.id,
            status: order.status,
            paymentStatus: order.paymentStatus,
            paymentMethod: order.paymentMethod,
        });
    }),
);

export default router;
