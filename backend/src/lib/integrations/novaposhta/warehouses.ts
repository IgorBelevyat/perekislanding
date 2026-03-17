import { getOrSet } from '../../cache/redis';
import { CacheKeys } from '../../cache/keys';
import { REDIS_TTL } from '../../config/constants';
import { npApiCall } from './client';
import type { NPWarehouse } from './types';

/**
 * Get all warehouses for a city. Cached for 6–24 hours.
 * If query provided, filters locally from cached full list.
 */
export async function getWarehouses(cityRef: string, query?: string): Promise<NPWarehouse[]> {
    // Always fetch full list for the city (cached)
    const allWarehouses = await getOrSet<NPWarehouse[]>(
        CacheKeys.npWarehouses(cityRef),
        REDIS_TTL.NP_WAREHOUSES,
        async () => {
            const result = await npApiCall<NPWarehouse>('Address', 'getWarehouses', {
                CityRef: cityRef,
                Limit: 500,
            });
            return result.data;
        },
    );

    // If query provided, filter locally (faster than re-calling API)
    if (query && query.trim().length > 0) {
        const q = query.toLowerCase().trim();
        return allWarehouses.filter(
            (w) =>
                w.Description.toLowerCase().includes(q) ||
                w.Number.includes(q) ||
                w.DescriptionRu.toLowerCase().includes(q),
        );
    }

    return allWarehouses;
}
