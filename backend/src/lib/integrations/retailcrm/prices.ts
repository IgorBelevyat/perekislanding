import { logger } from '../../security/logger';
import { env } from '../../config/env';
import { getMoySkladProduct, crmOfferToMsId } from '../moysklad/products';
import { fetchProducts } from './client';

// ─── Fallback mock prices (used when both MoySklad and CRM are down) ──

const MOCK_PRICES: Record<string, CachedOffer> = {
    [env.OFFER_ID_PEROXIDE || 'peroxide']: {
        offerId: env.OFFER_ID_PEROXIDE || 'peroxide',
        name: 'Перекис водню 50%',
        currency: 'UAH',
        updatedAt: new Date().toISOString(),
        prices: {
            [env.PRICE_TYPE_BASE]: 599,
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
        prices: { [env.PRICE_TYPE_BASE]: 180 }
    },
    [env.OFFER_ID_MEASURING_CUP || 'cup']: {
        offerId: env.OFFER_ID_MEASURING_CUP || 'cup',
        name: 'Мірна тара',
        currency: 'UAH',
        updatedAt: new Date().toISOString(),
        prices: { [env.PRICE_TYPE_BASE]: 150 }
    }
};

// ─── Types ──────────────────────────────────────────────────

export interface CachedOffer {
    offerId: string;          // CRM offer code (e.g. "337674164")
    name: string;             // Product name (Ukrainian)
    prices: Record<string, number>; // CRM price type code → price in UAH
    currency: string;
    updatedAt: string;
    imageUrl?: string;        // Product image URL (only for peroxide)
    availability?: string;    // Raw availability field ("+", "-", etc.)
    inStock?: boolean;        // Derived availability flag
}

// ─── Public API ─────────────────────────────────────────────
// Signature is unchanged — downstream code (bundles, quotes, crmSync)
// continues to work without any modifications.

/**
 * Get price/product data for a single offer.
 *
 * Data source: MoySklad (primary) → RetailCRM (fallback) → Mock (last resort).
 *
 * @param offerExternalId - CRM offer code (e.g. "337674164")
 */
export async function getOfferPrice(offerExternalId: string): Promise<CachedOffer | null> {
    // 1. Try MoySklad
    if (env.MOYSKLAD_TOKEN) {
        const msId = crmOfferToMsId(offerExternalId);
        if (msId) {
            try {
                const msProduct = await getMoySkladProduct(msId);
                if (msProduct) {
                    return {
                        offerId: offerExternalId, // Keep the CRM code!
                        name: msProduct.name,
                        prices: msProduct.prices,
                        currency: 'UAH',
                        updatedAt: new Date().toISOString(),
                        imageUrl: msProduct.imageUrl ?? undefined,
                        availability: msProduct.availability,
                        inStock: msProduct.inStock,
                    };
                }
            } catch (err) {
                logger.warn('MoySklad fetch failed, falling back to CRM', {
                    offerExternalId,
                    error: (err as Error).message,
                });
            }
        }
    }

    // 2. Fallback: try RetailCRM directly
    try {
        const products = await fetchProducts({ offerExternalIds: [offerExternalId] });
        for (const product of products) {
            const offer = product.offers.find((o) => o.externalId === offerExternalId);
            if (offer) {
                const priceMap: Record<string, number> = {};
                if (offer.prices && offer.prices.length > 0) {
                    offer.prices.forEach(p => {
                        priceMap[p.priceType] = p.price;
                    });
                }
                if (!priceMap[env.PRICE_TYPE_BASE] && offer.price) {
                    priceMap[env.PRICE_TYPE_BASE] = offer.price;
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
    } catch (err) {
        logger.error('Failed to get offer price from CRM', {
            offerExternalId,
            error: (err as Error).message,
        });

        // 3. Ultimate fallback: mock
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

    const promises = offerExternalIds.map(async (id) => {
        const cached = await getOfferPrice(id);
        if (cached) {
            results.set(id, cached);
        }
    });

    await Promise.all(promises);
    return results;
}

// ─── Price Consistency Check ─────────────────────────────────

/**
 * Check if MoySklad and CRM prices are consistent for peroxide.
 * Used to block checkout if CRM hasn't synced new prices yet.
 *
 * Returns `consistent: true` if:
 * - MoySklad is not configured (skip check)
 * - Prices match, or CRM fetch fails (give benefit of doubt)
 *
 * Returns `consistent: false` with details if base prices differ.
 */
export async function checkPriceConsistency(): Promise<{
    consistent: boolean;
    details: string[];
}> {
    const details: string[] = [];

    // Skip if MoySklad not configured
    if (!env.MOYSKLAD_TOKEN || !env.MOYSKLAD_ID_PEROXIDE) {
        return { consistent: true, details: ['MoySklad not configured — skipping check'] };
    }

    const peroxideCrmId = env.OFFER_ID_PEROXIDE;
    if (!peroxideCrmId) {
        return { consistent: true, details: ['Peroxide CRM ID not configured'] };
    }

    try {
        // Fetch from MoySklad (already cached)
        const msId = crmOfferToMsId(peroxideCrmId);
        if (!msId) {
            return { consistent: true, details: ['No MoySklad mapping for peroxide'] };
        }

        const msProduct = await getMoySkladProduct(msId);
        const msBasePrice = msProduct?.prices[env.PRICE_TYPE_BASE];

        // Fetch from CRM (fresh)
        let crmBasePrice: number | undefined;
        try {
            const products = await fetchProducts({ offerExternalIds: [peroxideCrmId] });
            for (const product of products) {
                const offer = product.offers.find(o => o.externalId === peroxideCrmId);
                if (offer) {
                    if (offer.prices && offer.prices.length > 0) {
                        const basePriceEntry = offer.prices.find(p => p.priceType === env.PRICE_TYPE_BASE);
                        if (basePriceEntry) crmBasePrice = basePriceEntry.price;
                    }
                    if (crmBasePrice === undefined && offer.price) {
                        crmBasePrice = offer.price;
                    }
                }
            }
        } catch {
            // CRM is down — be lenient, allow orders
            details.push('CRM unreachable — skipping price check');
            return { consistent: true, details };
        }

        if (msBasePrice === undefined) {
            details.push('MoySklad base price not found');
            return { consistent: true, details };
        }

        if (crmBasePrice === undefined) {
            details.push('CRM base price not found');
            return { consistent: true, details };
        }

        if (msBasePrice !== crmBasePrice) {
            details.push(
                `Price mismatch: MoySklad=${msBasePrice} UAH, CRM=${crmBasePrice} UAH`
            );
            logger.warn('Price consistency check failed', {
                msBasePrice,
                crmBasePrice,
            });
            return { consistent: false, details };
        }

        details.push(`Prices match: ${msBasePrice} UAH`);
        return { consistent: true, details };
    } catch (err) {
        // If check itself fails, be lenient
        details.push(`Check error: ${(err as Error).message}`);
        return { consistent: true, details };
    }
}
