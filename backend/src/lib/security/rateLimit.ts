import { Request, Response, NextFunction } from 'express';
import { getRedis } from '../cache/redis';
import { CacheKeys } from '../cache/keys';
import { RATE_LIMITS, REDIS_TTL } from '../config/constants';
import { logger } from './logger';

type RateLimitRoute = keyof typeof RATE_LIMITS;

/**
 * Resolve which rate limit policy applies to a given path.
 */
function resolvePolicy(path: string): { max: number; windowSec: number } | null {
    // Exact match first
    if (path in RATE_LIMITS) {
        return RATE_LIMITS[path as RateLimitRoute];
    }
    // Prefix match (e.g. /api/np/cities → /api/np)
    for (const [route, policy] of Object.entries(RATE_LIMITS)) {
        if (path.startsWith(route)) {
            return policy;
        }
    }
    return null;
}

/**
 * Get the client IP, respecting X-Forwarded-For from Nginx
 */
function getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
        return forwarded.split(',')[0].trim();
    }
    return req.ip ?? req.socket.remoteAddress ?? 'unknown';
}

/**
 * Redis-based sliding window rate limiter middleware.
 */
export function rateLimitMiddleware() {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const policy = resolvePolicy(req.path);
        if (!policy) {
            return next();
        }

        const ip = getClientIp(req);
        // Normalize route for key (strip trailing params)
        const routeBase = Object.keys(RATE_LIMITS).find((r) => req.path.startsWith(r)) ?? req.path;
        const key = CacheKeys.rateLimit(ip, routeBase);

        try {
            const redis = getRedis();
            const current = await redis.incr(key);

            // Set TTL on first request in window
            if (current === 1) {
                await redis.expire(key, policy.windowSec);
            }

            // Set rate limit headers
            const ttl = await redis.ttl(key);
            res.setHeader('X-RateLimit-Limit', policy.max);
            res.setHeader('X-RateLimit-Remaining', Math.max(0, policy.max - current));
            res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + ttl);

            if (current > policy.max) {
                logger.warn('Rate limit exceeded', { ip, route: routeBase, current });
                res.status(429).json({
                    error: 'Too many requests',
                    retryAfter: ttl,
                });
                return;
            }

            next();
        } catch (err) {
            // If Redis is down, let the request through (fail-open)
            logger.error('Rate limit check failed (Redis error)', {
                error: (err as Error).message,
            });
            next();
        }
    };
}
