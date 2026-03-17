import Redis from 'ioredis';
import { env } from '../config/env';

let redis: Redis | null = null;

export function getRedis(): Redis {
    if (!redis) {
        redis = new Redis(env.REDIS_URL, {
            maxRetriesPerRequest: 3,
            retryStrategy(times) {
                const delay = Math.min(times * 200, 5000);
                return delay;
            },
            lazyConnect: true,
        });

        redis.on('error', (err) => {
            console.error('[Redis] Connection error:', err.message);
        });

        redis.on('connect', () => {
            console.log('[Redis] Connected');
        });
    }
    return redis;
}

/**
 * Get cached value or compute & cache it.
 * Supports stale-while-revalidate pattern.
 */
export async function getOrSet<T>(
    key: string,
    ttlSec: number,
    fetcher: () => Promise<T>,
    staleTtlSec = 0,
): Promise<T> {
    const r = getRedis();
    const cached = await r.get(key);

    if (cached) {
        try {
            return JSON.parse(cached) as T;
        } catch {
            // corrupted cache, refetch
        }
    }

    const data = await fetcher();
    const totalTtl = ttlSec + staleTtlSec;
    await r.setex(key, totalTtl, JSON.stringify(data));

    return data;
}

/**
 * Delete a cache key
 */
export async function delCache(key: string): Promise<void> {
    await getRedis().del(key);
}

/**
 * Gracefully disconnect Redis
 */
export async function disconnectRedis(): Promise<void> {
    if (redis) {
        await redis.quit();
        redis = null;
    }
}
