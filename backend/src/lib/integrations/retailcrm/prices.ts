import { getOrSet } from '../../cache/redis';
import { CacheKeys } from '../../cache/keys';
import { REDIS_TTL } from '../../config/constants';
import { fetchProducts } from './client';
import type { RetailCrmOffer } from './types';
import { logger } from '../../security/logger';

interface CachedOffer {
    offerId: string;
    name: string;
    price: number;
    currency: string;
    updatedAt: string;
}

/**
 * Get price for a single offer — cached in Redis.
 */
export async function getOfferPrice(offerExternalId: string): Promise<CachedOffer | null> {
    try {
        return await getOrSet<CachedOffer | null>(
            CacheKeys.rcOffer(offerExternalId),
            REDIS_TTL.RC_OFFER,
            async () => {
                const products = await fetchProducts({ offerExternalIds: [offerExternalId] });
                for (const product of products) {
                    const offer = product.offers.find((o) => o.externalId === offerExternalId);
                    if (offer) {
                        return {
                            offerId: offer.externalId,
                            name: offer.name,
                            price: offer.price,
                            currency: offer.currency ?? 'UAH',
                            updatedAt: new Date().toISOString(),
                        };
                    }
                }
                return null;
            },
            REDIS_TTL.RC_OFFER_STALE,
        );
    } catch (err) {
        logger.error('Failed to get offer price', { offerExternalId, error: (err as Error).message });
        throw err;
    }
}

/**
 * Get prices for multiple offers at once.
 * Fetches from cache first, then bulk-fetches missing ones.
 */
export async function getOfferPrices(offerExternalIds: string[]): Promise<Map<string, CachedOffer>> {
    const results = new Map<string, CachedOffer>();

    // Try to get all from cache in parallel
    const promises = offerExternalIds.map(async (id) => {
        const cached = await getOfferPrice(id);
        if (cached) {
            results.set(id, cached);
        }
    });

    await Promise.all(promises);
    return results;
}
