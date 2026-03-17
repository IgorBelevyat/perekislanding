import { Router } from 'express';
import { prisma } from '../lib/db/prisma';
import { getRedis } from '../lib/cache/redis';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * GET /api/health
 * Check DB + Redis connectivity.
 */
router.get(
    '/',
    asyncHandler(async (_req, res) => {
        const checks: Record<string, { status: string; latencyMs?: number }> = {};

        // Check PostgreSQL
        const dbStart = Date.now();
        try {
            await prisma.$queryRaw`SELECT 1`;
            checks.database = { status: 'ok', latencyMs: Date.now() - dbStart };
        } catch (err) {
            checks.database = { status: 'error' };
        }

        // Check Redis
        const redisStart = Date.now();
        try {
            const redis = getRedis();
            await redis.ping();
            checks.redis = { status: 'ok', latencyMs: Date.now() - redisStart };
        } catch (err) {
            checks.redis = { status: 'error' };
        }

        const allOk = Object.values(checks).every((c) => c.status === 'ok');

        res.status(allOk ? 200 : 503).json({
            status: allOk ? 'healthy' : 'degraded',
            uptime: process.uptime(),
            checks,
        });
    }),
);

export default router;
