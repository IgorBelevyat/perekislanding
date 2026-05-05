import { Router } from 'express';
import { prisma } from '../lib/db/prisma';
import { getRedis } from '../lib/cache/redis';
import { asyncHandler } from '../middleware/errorHandler';
import dns from 'node:dns/promises';

const router = Router();

/**
 * GET /api/health
 * Check DB + Redis + egress connectivity.
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

        // Check egress (DNS resolution)
        const dnsStart = Date.now();
        try {
            await Promise.race([
                dns.resolve4('google.com'),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('DNS timeout')), 3000)
                ),
            ]);
            checks.egress = { status: 'ok', latencyMs: Date.now() - dnsStart };
        } catch (err) {
            checks.egress = { status: 'error' };
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

