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
 * Supports stale-while-revalidate pattern:
 *
 *  1) Cache HIT (within primary TTL)   → return cached data
 *  2) Cache MISS / expired             → call fetcher (CRM)
 *     2a) Fetcher succeeds             → store in Redis with (ttl + staleTtl), return fresh data
 *     2b) Fetcher FAILS + stale exists → return stale data (CRM is down, serve old prices)
 *     2c) Fetcher FAILS + no stale     → error propagates (caught by MOCK fallback in prices.ts)
 *
 * The stale key (key:stale) is kept with a much longer TTL so
 * it survives well beyond cache expiration, giving us a safety net.
 */
export async function getOrSet<T>(
    key: string,
    ttlSec: number,
    fetcher: () => Promise<T>,
    staleTtlSec = 0,
): Promise<T> {
    const r = getRedis();
    const staleKey = `${key}:stale`;

    // 1) Try primary cache
    const cached = await r.get(key);
    if (cached) {
        try {
            return JSON.parse(cached) as T;
        } catch {
            // corrupted cache, refetch
        }
    }

    // 2) Primary cache miss — call the fetcher (CRM)
    try {
        const data = await fetcher();
        // Store primary cache
        await r.setex(key, ttlSec, JSON.stringify(data));
        // Store stale copy with much longer TTL (24 hours)
        if (staleTtlSec > 0) {
            await r.setex(staleKey, 86400, JSON.stringify(data));
        }
        return data;
    } catch (fetchErr) {
        // 2b) Fetcher failed — try stale data
        if (staleTtlSec > 0) {
            const stale = await r.get(staleKey);
            if (stale) {
                try {
                    console.warn(`[Cache] Serving stale data for ${key} (fetcher failed)`);
                    return JSON.parse(stale) as T;
                } catch {
                    // corrupted stale, propagate original error
                }
            }
        }
        // 2c) No stale data available — let error propagate to MOCK fallback
        throw fetchErr;
    }
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
