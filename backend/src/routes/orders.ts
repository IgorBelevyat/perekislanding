import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { prisma } from '../lib/db/prisma';
import { z } from 'zod';

const router = Router();

const historyQuerySchema = z.object({
    customerId: z.string().uuid(),
});

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

        // Query orders where the customer JSON contains the matching customerExternalId
        // Prisma supports JSON filtering with `path` syntax for PostgreSQL
        const orders = await prisma.order.findMany({
            where: {
                customer: {
                    path: ['customerExternalId'],
                    equals: customerId,
                },
                status: {
                    in: ['CONFIRMED', 'AWAITING_PAYMENT', 'CREATED'],
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
