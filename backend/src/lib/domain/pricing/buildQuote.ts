import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../db/prisma';
import { getOfferPrices } from '../../integrations/retailcrm/prices';
import { fullCalculation } from '../calculator/formulas';
import { QUOTE_TTL_MS } from '../../config/constants';
import { env } from '../../config/env';
import { logger } from '../../security/logger';
import type { QuoteRequest } from '../../validation/quote.schema';

export interface QuoteItem {
    offerId: string;
    name: string;
    qty: number;
    unitPrice: number;    // discounted or base price (what user actually pays)
    basePrice: number;    // standard retail price before bundle discount
    total: number;        // unitPrice * qty
    baseTotal: number;    // basePrice * qty
    isBundleItem?: boolean; // identifies bundle context match
    bundleId?: string;    // exact package ID this item belongs to
    priceType?: string;   // specific CRM price type
}

export interface QuoteResult {
    quoteId: string;
    items: QuoteItem[];
    totals: { subtotal: number; total: number; benefit: number; };
    calcResult: {
        volumeM3: number;
        dosageLiters: number;
        requiredCanisters: number;
    };
    expiresAt: string;
}

/**
 * Build a server-side quote:
 * 1. Run calculator formulas
 * 2. Look up bundle → offer IDs
 * 3. Fetch prices from RetailCRM (cached)
 * 4. Build items + totals
 * 5. Save snapshot in DB
 */
export async function buildQuote(input: QuoteRequest): Promise<QuoteResult> {
    const items: QuoteItem[] = [];
    let bundleIdStr: string | null = null;
    let calcResult = { volumeM3: 0, dosageLiters: 0, requiredCanisters: 0 };
    let selectedOfferIds: string[] = [];
    let calcInputData: any = input.calcInput || {};

    // Optional: Legacy global packagePriceType if we somehow needed it outside customItems
    let globalPackagePriceType = 'base';
    if (input.bundleId === 'nasezon') globalPackagePriceType = env.PRICE_TYPE_NASEZON || 'base';
    else if (input.bundleId === 'optimal') globalPackagePriceType = env.PRICE_TYPE_OPTIMAL || 'base';
    else if (input.bundleId === 'pro') globalPackagePriceType = env.PRICE_TYPE_PRO || 'base';

    // Custom Cart Items flow
    if (input.customItems?.length) {
        selectedOfferIds = input.customItems.map(i => i.offerId);
        const priceMap = await getOfferPrices(selectedOfferIds);

        for (const customItem of input.customItems) {
            const offer = priceMap.get(customItem.offerId);
            if (!offer) {
                logger.warn('Offer not found in RetailCRM', { offerId: customItem.offerId });
                continue;
            }

            const basePrice = offer.prices[env.PRICE_TYPE_BASE] ?? 0;
            let activePrice = basePrice;
            let activePriceType = env.PRICE_TYPE_BASE;

            // Gift items in bundles have price = 0
            if (customItem.isGift) {
                activePrice = 0;
            }
            // Apply package specific discounts ONLY if it was added as part of a bundle
            else if (customItem.isBundleItem && customItem.bundleId) {
                let packagePriceType = env.PRICE_TYPE_BASE;
                let minQtyAllowed = 1;
                if (customItem.bundleId === 'nasezon') { packagePriceType = env.PRICE_TYPE_NASEZON || 'base'; minQtyAllowed = 1; }
                else if (customItem.bundleId === 'optimal') { packagePriceType = env.PRICE_TYPE_OPTIMAL || 'base'; minQtyAllowed = 2; }
                else if (customItem.bundleId === 'pro') { packagePriceType = env.PRICE_TYPE_PRO || 'base'; minQtyAllowed = 6; }

                if (customItem.offerId === env.OFFER_ID_PEROXIDE && customItem.qty >= minQtyAllowed) {
                    activePrice = offer.prices[packagePriceType] ?? basePrice;
                    // If CRM actually knows about this price type for this product
                    if (offer.prices[packagePriceType] !== undefined) {
                        activePriceType = packagePriceType;
                    }
                }
            }

            items.push({
                offerId: customItem.offerId,
                name: offer.name,
                qty: customItem.qty,
                basePrice: basePrice,
                unitPrice: activePrice,
                baseTotal: basePrice * customItem.qty,
                total: activePrice * customItem.qty,
                // Send this back so the frontend can match it in `CartContext`
                isBundleItem: customItem.isBundleItem,
                bundleId: customItem.bundleId,
                priceType: activePriceType !== 'base' ? activePriceType : undefined
            });
        }
    } else {
        // Standard Calculator flow
        if (!input.bundleId || !input.calcInput || !input.k) {
            throw new Error('Missing standard quote parameters (bundleId, calcInput, k)');
        }

        const bundle = await prisma.bundleMap.findFirst({
            where: { slug: input.bundleId, isActive: true },
        });

        if (!bundle) {
            throw Object.assign(new Error(`Bundle not found: ${input.bundleId}`), { statusCode: 404 });
        }

        bundleIdStr = bundle.id;

        calcResult = fullCalculation(input.calcInput, input.k);
        const addonOfferIds = (bundle.addonOfferIds as string[]) ?? [];
        const allOfferIds = [bundle.baseOfferId, ...addonOfferIds];

        selectedOfferIds = input.addonSelection
            ? [bundle.baseOfferId, ...input.addonSelection.filter((id) => addonOfferIds.includes(id))]
            : input.includeAddons
                ? allOfferIds
                : [bundle.baseOfferId];

        const priceMap = await getOfferPrices(selectedOfferIds);

        for (const offerId of selectedOfferIds) {
            const offer = priceMap.get(offerId);
            if (!offer) {
                logger.warn('Offer not found in RetailCRM', { offerId });
                continue;
            }

            // Calculator flow always uses base price since no package was explicitly clicked
            const basePrice = offer.prices[env.PRICE_TYPE_BASE] ?? 0;
            const qty = offerId === bundle.baseOfferId ? calcResult.requiredCanisters : 1;
            items.push({
                offerId,
                name: offer.name,
                qty,
                basePrice: basePrice,
                unitPrice: basePrice,
                baseTotal: basePrice * qty,
                total: basePrice * qty,
            });
        }
    }

    // 6. Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.baseTotal, 0); // Cart shows sum without discounts as "subtotal" initially? Or subtotal = total. Let's make subtotal = baseTotal, total = actual total
    const total = items.reduce((sum, item) => sum + item.total, 0);
    const benefit = subtotal - total;
    const totals = { subtotal, total, benefit };

    // 7. Save quote snapshot in DB
    const expiresAt = new Date(Date.now() + QUOTE_TTL_MS);
    const pricingVersion = `retailcrm@${new Date().toISOString()}`;

    const quote = await prisma.quote.create({
        data: {
            bundleId: (bundleIdStr ?? undefined) as any,
            calcInput: calcInputData,
            itemsSnapshot: items as any,
            totalsSnapshot: totals as any,
            pricingVersion,
            expiresAt,
            status: 'ACTIVE',
        },
    });

    logger.info('Quote created', {
        quoteId: quote.id,
        bundleId: bundleIdStr,
        total: totals.total,
    });

    return {
        quoteId: quote.id,
        items,
        totals,
        calcResult: {
            volumeM3: calcResult.volumeM3,
            dosageLiters: calcResult.dosageLiters,
            requiredCanisters: calcResult.requiredCanisters,
        },
        expiresAt: expiresAt.toISOString(),
    };
}
