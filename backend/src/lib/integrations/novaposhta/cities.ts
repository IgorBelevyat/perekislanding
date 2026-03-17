import { getOrSet } from '../../cache/redis';
import { CacheKeys } from '../../cache/keys';
import { REDIS_TTL } from '../../config/constants';
import { npApiCall } from './client';
import type { NPCity } from './types';

/**
 * NP searchSettlements returns a nested structure:
 * { data: [{ TotalCount, Addresses: [...cities] }] }
 */
interface SearchSettlementsResponse {
    TotalCount: number;
    Addresses: NPCity[];
}

/**
 * Search cities by name query. Cached for 12–24 hours.
 */
export async function searchCities(query: string): Promise<NPCity[]> {
    const normalizedQuery = query.toLowerCase().trim();

    return getOrSet<NPCity[]>(
        CacheKeys.npCities(normalizedQuery),
        REDIS_TTL.NP_CITIES,
        async () => {
            const result = await npApiCall<SearchSettlementsResponse>('Address', 'searchSettlements', {
                CityName: query,
                Limit: 20,
            });

            // NP nests results: data[0].Addresses
            if (result.data.length > 0 && result.data[0].Addresses) {
                return result.data[0].Addresses;
            }
            return [];
        },
    );
}
