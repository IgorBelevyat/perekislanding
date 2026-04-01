import app from './app';
import { env } from './lib/config/env';
import { prisma } from './lib/db/prisma';
import { getRedis, disconnectRedis } from './lib/cache/redis';
import { logger } from './lib/security/logger';
import { retryFailedCrmOrders } from './lib/domain/checkout/crmSync';

async function main() {
    logger.info(`Starting server in ${env.NODE_ENV} mode...`);

    // Connect to PostgreSQL
    try {
        await prisma.$connect();
        logger.info('PostgreSQL connected');
    } catch (err) {
        logger.error('Failed to connect to PostgreSQL', { error: (err as Error).message });
        process.exit(1);
    }

    // Connect to Redis
    try {
        const redis = getRedis();
        await redis.connect();
        logger.info('Redis connected');
    } catch (err) {
        logger.warn('Redis connection failed — continuing without cache', { error: (err as Error).message });
        // Non-fatal: app works without Redis (no caching/rate-limiting)
    }

    // Start HTTP server
    const server = app.listen(env.PORT, () => {
        logger.info(`Server listening on port ${env.PORT}`);
        logger.info(`Health check: http://localhost:${env.PORT}/api/health`);
    });

    // ─── CRM Outbox Worker ─────────────────────────────────────
    // Retry failed CRM pushes every 3 minutes
    const CRM_OUTBOX_INTERVAL_MS = 3 * 60 * 1000;
    const outboxTimer = setInterval(() => {
        retryFailedCrmOrders().catch(err => {
            logger.error('CRM outbox worker uncaught error', { error: (err as Error).message });
        });
    }, CRM_OUTBOX_INTERVAL_MS);
    logger.info(`CRM outbox worker started (every ${CRM_OUTBOX_INTERVAL_MS / 1000}s)`);

    // ─── Graceful shutdown ─────────────────────────────────────
    const shutdown = async (signal: string) => {
        logger.info(`${signal} received — shutting down gracefully`);

        // Stop the outbox worker
        clearInterval(outboxTimer);

        server.close(async () => {
            try {
                await prisma.$disconnect();
                await disconnectRedis();
                logger.info('All connections closed');
                process.exit(0);
            } catch (err) {
                logger.error('Error during shutdown', { error: (err as Error).message });
                process.exit(1);
            }
        });

        // Force kill after 10s
        setTimeout(() => {
            logger.error('Forced shutdown after timeout');
            process.exit(1);
        }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
    logger.error('Fatal startup error', { error: (err as Error).message });
    process.exit(1);
});
