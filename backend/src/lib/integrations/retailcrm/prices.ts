import { getOrSet } from '../../cache/redis';
import { CacheKeys } from '../../cache/keys';
import { REDIS_TTL } from '../../config/constants';
import { fetchProducts } from './client';
import type { RetailCrmOffer } from './types';
import { logger } from '../../security/logger';
import { env } from '../../config/env';

const MOCK_PRICES: Record<string, CachedOffer> = {
    [env.OFFER_ID_PEROXIDE || 'peroxide']: {
        offerId: env.OFFER_ID_PEROXIDE || 'peroxide',
        name: 'Перекис водню 50%',
        currency: 'UAH',
        updatedAt: new Date().toISOString(),
        prices: {
            'base': 599,
            [env.PRICE_TYPE_NASEZON || 'nasezon']: 569,
            [env.PRICE_TYPE_OPTIMAL || 'optimal']: 549,
            [env.PRICE_TYPE_PRO || 'pro']: 539,
        }
    },
    [env.OFFER_ID_TEST_STRIPS || 'strips']: {
        offerId: env.OFFER_ID_TEST_STRIPS || 'strips',
        name: 'Тест-смужки для перекису',
        currency: 'UAH',
        updatedAt: new Date().toISOString(),
        prices: { 'base': 180 }
    },
    [env.OFFER_ID_MEASURING_CUP || 'cup']: {
        offerId: env.OFFER_ID_MEASURING_CUP || 'cup',
        name: 'Мірна тара',
        currency: 'UAH',
        updatedAt: new Date().toISOString(),
        prices: { 'base': 150 }
    }
};

interface CachedOffer {
    offerId: string;
    name: string;
    prices: Record<string, number>;
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
                        const priceMap: Record<string, number> = {};
                        // Map all available retailcrm prices
                        if (offer.prices && offer.prices.length > 0) {
                            offer.prices.forEach(p => {
                                priceMap[p.priceType] = p.price;
                            });
                        }
                        // Always ensure we have at least 'base' mapped to the default price
                        if (!priceMap['base'] && offer.price) {
                            priceMap['base'] = offer.price;
                        }

                        return {
                            offerId: offer.externalId,
                            name: offer.name,
                            prices: priceMap,
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
        
        // Ultimate fallback: return mock if cache and CRM are down
        if (MOCK_PRICES[offerExternalId]) {
            logger.warn('Using fallback MOCK prices for offer', { offerExternalId });
            return MOCK_PRICES[offerExternalId];
        }
        
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
