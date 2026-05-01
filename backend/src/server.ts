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

    // ─── CRM Outbox Worker with Backoff ───────────────────────
    const CRM_OUTBOX_INTERVAL_MS = 3 * 60 * 1000;       // 3 minutes normal
    const CRM_OUTBOX_BACKOFF_MS = 15 * 60 * 1000;       // 15 minutes after failures
    const CRM_OUTBOX_MAX_CONSECUTIVE_FAILS = 3;

    let crmConsecutiveFails = 0;
    let crmBackoffUntil = 0;

    const outboxTimer = setInterval(async () => {
        // Skip if in backoff period
        if (Date.now() < crmBackoffUntil) {
            return;
        }

        try {
            await retryFailedCrmOrders();
            // Reset on success
            if (crmConsecutiveFails > 0) {
                logger.info('CRM outbox worker recovered after failures', { previousFails: crmConsecutiveFails });
            }
            crmConsecutiveFails = 0;
        } catch (err) {
            crmConsecutiveFails++;
            logger.error('CRM outbox worker error', {
                error: (err as Error).message,
                consecutiveFails: crmConsecutiveFails,
            });

            if (crmConsecutiveFails >= CRM_OUTBOX_MAX_CONSECUTIVE_FAILS) {
                crmBackoffUntil = Date.now() + CRM_OUTBOX_BACKOFF_MS;
                logger.warn(`CRM outbox worker backing off for ${CRM_OUTBOX_BACKOFF_MS / 60000} min after ${crmConsecutiveFails} consecutive failures`);
                crmConsecutiveFails = 0; // Reset counter for next cycle
            }
        }
    }, CRM_OUTBOX_INTERVAL_MS);
    logger.info(`CRM outbox worker started (every ${CRM_OUTBOX_INTERVAL_MS / 1000}s, backoff after ${CRM_OUTBOX_MAX_CONSECUTIVE_FAILS} fails)`);

    // ─── Event Loop Lag Monitor ───────────────────────────────
    const EL_CHECK_INTERVAL_MS = 5000;  // Check every 5 seconds
    const EL_WARN_THRESHOLD_MS = 100;   // Warn if lag > 100ms
    const EL_ERROR_THRESHOLD_MS = 500;  // Error if lag > 500ms

    let elLastCheck = Date.now();
    const elMonitor = setInterval(() => {
        const now = Date.now();
        const expected = elLastCheck + EL_CHECK_INTERVAL_MS;
        const lag = now - expected;
        elLastCheck = now;

        if (lag > EL_ERROR_THRESHOLD_MS) {
            logger.error('Event loop severely blocked', { lagMs: lag });
        } else if (lag > EL_WARN_THRESHOLD_MS) {
            logger.warn('Event loop lag detected', { lagMs: lag });
        }
    }, EL_CHECK_INTERVAL_MS);
    elMonitor.unref(); // Don't prevent graceful shutdown

    // ─── Graceful shutdown ─────────────────────────────────────
    const shutdown = async (signal: string) => {
        logger.info(`${signal} received — shutting down gracefully`);

        // Stop workers and monitors
        clearInterval(outboxTimer);
        clearInterval(elMonitor);

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
