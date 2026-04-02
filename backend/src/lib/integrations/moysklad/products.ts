import { getOrSet } from '../../cache/redis';
import { CacheKeys } from '../../cache/keys';
import { REDIS_TTL } from '../../config/constants';
import { env } from '../../config/env';
import { logger } from '../../security/logger';
import { fetchProduct, fetchProductImages, fetchProductStock, extractId } from './client';
import type { MsProductData } from './types';

// ─── Mapping Tables ───────────────────────────────────────────
// Built once at startup from env vars.

/**
 * MoySklad UUID → CRM offer code.
 * e.g. "a7a0514f-..." → "337674164"
 */
function buildMsIdToCrmOfferMap(): Record<string, string> {
    const map: Record<string, string> = {};
    if (env.MOYSKLAD_ID_PEROXIDE && env.OFFER_ID_PEROXIDE)
        map[env.MOYSKLAD_ID_PEROXIDE] = env.OFFER_ID_PEROXIDE;
    if (env.MOYSKLAD_ID_TEST_STRIPS && env.OFFER_ID_TEST_STRIPS)
        map[env.MOYSKLAD_ID_TEST_STRIPS] = env.OFFER_ID_TEST_STRIPS;
    if (env.MOYSKLAD_ID_MEASURING_CUP && env.OFFER_ID_MEASURING_CUP)
        map[env.MOYSKLAD_ID_MEASURING_CUP] = env.OFFER_ID_MEASURING_CUP;
    return map;
}

/**
 * CRM offer code → MoySklad UUID (reverse lookup).
 * e.g. "337674164" → "a7a0514f-..."
 */
function buildCrmOfferToMsIdMap(): Record<string, string> {
    const forward = buildMsIdToCrmOfferMap();
    const reverse: Record<string, string> = {};
    for (const [msId, crmId] of Object.entries(forward)) {
        reverse[crmId] = msId;
    }
    return reverse;
}

/**
 * MoySklad price type UUID → CRM price type code.
 * e.g. "594518c6-..." → "base"
 *
 * Uses the existing PRICE_TYPE_* env vars as the CRM codes,
 * paired with the MOYSKLAD_PRICE_* UUIDs.
 */
function buildMsPriceToCrmCodeMap(): Record<string, string> {
    const map: Record<string, string> = {};
    if (env.MOYSKLAD_PRICE_ROZNICA)
        map[env.MOYSKLAD_PRICE_ROZNICA] = env.PRICE_TYPE_BASE;          // "base"
    if (env.MOYSKLAD_PRICE_TEST_LIFE)
        map[env.MOYSKLAD_PRICE_TEST_LIFE] = env.PRICE_TYPE_NASEZON;    // "TEST_LIFE"
    if (env.MOYSKLAD_PRICE_AKCIA)
        map[env.MOYSKLAD_PRICE_AKCIA] = env.PRICE_TYPE_OPTIMAL;        // "SINEVO"
    if (env.MOYSKLAD_PRICE_OPT)
        map[env.MOYSKLAD_PRICE_OPT] = env.PRICE_TYPE_PRO;              // "OPT"
    return map;
}

// Lazy-initialized singletons
let _msIdToCrm: Record<string, string> | null = null;
let _crmToMsId: Record<string, string> | null = null;
let _msPriceToCrm: Record<string, string> | null = null;

function getMsIdToCrmMap() { return _msIdToCrm ??= buildMsIdToCrmOfferMap(); }
function getCrmToMsIdMap() { return _crmToMsId ??= buildCrmOfferToMsIdMap(); }
function getMsPriceToCrmMap() { return _msPriceToCrm ??= buildMsPriceToCrmCodeMap(); }

/**
 * Resolve a CRM offer code (e.g. "337674164") to its MoySklad UUID.
 * Returns undefined if not found.
 */
export function crmOfferToMsId(crmOfferId: string): string | undefined {
    return getCrmToMsIdMap()[crmOfferId];
}

/**
 * Check if a given MoySklad UUID is the peroxide product.
 */
function isPeroxide(msId: string): boolean {
    return msId === env.MOYSKLAD_ID_PEROXIDE;
}

// ─── Core Product Fetch ──────────────────────────────────────

/**
 * Fetch and normalize a single MoySklad product.
 * Cached in Redis for 5 min (stale-while-revalidate up to 1h).
 *
 * Returns null if the product is not configured or fetch fails.
 */
export async function getMoySkladProduct(moyskladId: string): Promise<MsProductData | null> {
    const crmOfferId = getMsIdToCrmMap()[moyskladId];
    if (!crmOfferId) {
        logger.warn('MoySklad product has no CRM mapping', { moyskladId });
        return null;
    }

    try {
        return await getOrSet<MsProductData | null>(
            CacheKeys.msProduct(moyskladId),
            REDIS_TTL.MS_PRODUCT,
            async () => {
                const product = await fetchProduct(moyskladId);

                // ── Name: "Наименование укр." attribute, fallback product.name ──
                let name = product.name;
                if (product.attributes) {
                    const ukrNameAttr = product.attributes.find(
                        a => a.name === 'Наименование укр.' || a.name === 'Наименование укр'
                    );
                    if (ukrNameAttr) {
                        const val = typeof ukrNameAttr.value === 'string'
                            ? ukrNameAttr.value
                            : ukrNameAttr.value?.name;
                        if (val) name = val;
                    }
                }

                // ── Image: only for peroxide ──
                let imageUrl: string | null = null;
                if (isPeroxide(moyskladId)) {
                    const imagesMeta = product.images?.meta;
                    if (imagesMeta && imagesMeta.size > 0) {
                        try {
                            const images = await fetchProductImages(moyskladId);
                            if (images.length > 0) {
                                // Use downloadHref for full resolution (not miniature/tiny thumbnails)
                                imageUrl = images[0].meta?.downloadHref ?? images[0].miniature?.href ?? null;
                            }
                        } catch (imgErr) {
                            logger.warn('Failed to fetch MoySklad images', {
                                moyskladId,
                                error: (imgErr as Error).message,
                            });
                        }
                    }
                }

                // ── Prices: map MoySklad UUID → CRM code ──
                const priceMap = getMsPriceToCrmMap();
                const prices: Record<string, number> = {};

                if (product.salePrices) {
                    for (const sp of product.salePrices) {
                        const msTypeId = extractId(sp.priceType?.meta?.href ?? '');
                        const crmCode = priceMap[msTypeId];
                        if (crmCode) {
                            // MoySklad stores prices in kopecks (×100)
                            // Keep decimal precision (e.g. 57450 → 574.5)
                            prices[crmCode] = sp.value / 100;
                        }
                    }
                }

                // ── Availability ──
                // Try the standard "Наличие" attribute first
                let availability = '';
                if (product.attributes) {
                    const availAttr = product.attributes.find(
                        a => a.name === 'Наличие' || a.name === 'Наявність'
                    );
                    if (availAttr && typeof availAttr.value === 'string') {
                        availability = availAttr.value.trim();
                    }
                }

                // Derive inStock according to custom MoySklad rules:
                // "+" = есть в наличии
                // "-" = нет в наличии
                // "&" = ожидается
                // "@" = услуга
                // Stock quantity fallback (fetched separately only if needed)
                let stockQty: number | null = null;

                // "пустое поле" (or missing) = fallback to stock.
                let inStock = false;
                if (availability === '+') inStock = true;
                else if (availability === '-') inStock = false;
                else if (availability === '&') inStock = true;
                else if (availability === '@') inStock = true;
                else if (/^\d+$/.test(availability)) inStock = true;
                else {
                    // Fallback to actual stock quantity when attribute is missing
                    try {
                        stockQty = await fetchProductStock(moyskladId);
                        inStock = stockQty > 0;
                    } catch (e) {
                        logger.warn('Failed to fetch fallback stock', { moyskladId });
                        inStock = true; // Safe fallback if API fails
                    }
                }

                return {
                    moyskladId,
                    crmOfferId,
                    name,
                    imageUrl,
                    prices,
                    availability,
                    inStock,
                    stockQty,
                };
            },
            REDIS_TTL.MS_PRODUCT_STALE,
        );
    } catch (err) {
        logger.error('Failed to get MoySklad product', {
            moyskladId,
            error: (err as Error).message,
        });
        return null;
    }
}

/**
 * Fetch multiple products by their MoySklad UUIDs.
 */
export async function getMoySkladProducts(
    moyskladIds: string[],
): Promise<Map<string, MsProductData>> {
    const results = new Map<string, MsProductData>();

    const promises = moyskladIds.map(async (id) => {
        const data = await getMoySkladProduct(id);
        if (data) {
            results.set(id, data);
        }
    });

    await Promise.all(promises);
    return results;
}
