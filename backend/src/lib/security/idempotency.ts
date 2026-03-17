import { Request, Response, NextFunction } from 'express';
import { getRedis } from '../cache/redis';
import { CacheKeys } from '../cache/keys';
import { REDIS_TTL } from '../config/constants';
import { logger } from './logger';

/**
 * Idempotency middleware for checkout endpoint.
 *
 * Expects `Idempotency-Key` header (UUID).
 * If key seen before → returns cached orderId.
 * If new → allows request, then caller must store result via `setIdempotencyResult`.
 */
export function idempotencyMiddleware() {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const idempotencyKey = req.headers['idempotency-key'] as string | undefined;

        if (!idempotencyKey) {
            res.status(400).json({ error: 'Missing Idempotency-Key header' });
            return;
        }

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(idempotencyKey)) {
            res.status(400).json({ error: 'Idempotency-Key must be a valid UUID' });
            return;
        }

        try {
            const redis = getRedis();
            const key = CacheKeys.idempotency(idempotencyKey);
            const existing = await redis.get(key);

            if (existing) {
                logger.info('Idempotent request — returning cached result', { idempotencyKey });
                const cached = JSON.parse(existing);
                res.status(200).json(cached);
                return;
            }

            // Store key on the request for later use in the route handler
            (req as any).idempotencyKey = idempotencyKey;
            next();
        } catch (err) {
            logger.error('Idempotency check failed', { error: (err as Error).message });
            // Fail-open: let request proceed
            (req as any).idempotencyKey = idempotencyKey;
            next();
        }
    };
}

/**
 * Store the result of a successful idempotent operation in Redis.
 */
export async function setIdempotencyResult(
    idempotencyKey: string,
    result: Record<string, unknown>,
): Promise<void> {
    try {
        const redis = getRedis();
        const key = CacheKeys.idempotency(idempotencyKey);
        await redis.setex(key, REDIS_TTL.IDEMPOTENCY, JSON.stringify(result));
    } catch (err) {
        logger.error('Failed to store idempotency result', {
            error: (err as Error).message,
            idempotencyKey,
        });
    }
}
