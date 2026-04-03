import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { prisma } from '../lib/db/prisma';
import { z } from 'zod';
import crypto from 'crypto';

const router = Router();

const historyQuerySchema = z.object({
    customerId: z.string().uuid(),
});

/**
 * Compute the same 8-digit order number from UUID as createCheckout.ts does.
 * This is deterministic — same UUID always produces the same number.
 */
function computeOrderNumber(orderId: string): string {
    const hash = crypto.createHash('sha256').update(orderId).digest('hex');
    const num = parseInt(hash.substring(0, 10), 16);
    return (num % 100000000).toString().padStart(8, '0');
}

/**
 * GET /api/orders/history?customerId=<uuid>
 * Returns order history for a given customerExternalId.
 * Items are returned as stored in itemsSnapshot (server-side format).
 */
router.get(
    '/history',
    asyncHandler(async (req, res) => {
        const parsed = historyQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            res.status(400).json({ error: 'Invalid or missing customerId (UUID)' });
            return;
        }

        const { customerId } = parsed.data;

        const orders = await prisma.order.findMany({
            where: {
                customer: {
                    path: ['customerExternalId'],
                    equals: customerId,
                },
                // Only show confirmed orders — excludes AWAITING_PAYMENT
                // (LiqPay orders that were never paid)
                status: {
                    in: ['CONFIRMED', 'CREATED'],
                },
            },
            select: {
                id: true,
                createdAt: true,
                total: true,
                status: true,
                paymentStatus: true,
                paymentMethod: true,
                itemsSnapshot: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });

        res.json({
            orders: orders.map(o => ({
                id: o.id,
                orderNumber: computeOrderNumber(o.id),
                date: o.createdAt.toISOString(),
                total: Number(o.total),
                status: o.status,
                paymentStatus: o.paymentStatus,
                paymentMethod: o.paymentMethod,
                items: o.itemsSnapshot as any[],
            })),
        });
    }),
);

export default router;

