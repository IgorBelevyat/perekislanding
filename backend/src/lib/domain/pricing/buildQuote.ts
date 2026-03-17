import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../db/prisma';
import { getOfferPrices } from '../../integrations/retailcrm/prices';
import { fullCalculation } from '../calculator/formulas';
import { QUOTE_TTL_MS } from '../../config/constants';
import { logger } from '../../security/logger';
import type { QuoteRequest } from '../../validation/quote.schema';

export interface QuoteItem {
    offerId: string;
    name: string;
    qty: number;
    unitPrice: number;
    total: number;
}

export interface QuoteResult {
    quoteId: string;
    items: QuoteItem[];
    totals: { subtotal: number; total: number };
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
            items.push({
                offerId: customItem.offerId,
                name: offer.name,
                qty: customItem.qty,
                unitPrice: offer.price,
                total: offer.price * customItem.qty,
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

            const qty = offerId === bundle.baseOfferId ? calcResult.requiredCanisters : 1;
            items.push({
                offerId,
                name: offer.name,
                qty,
                unitPrice: offer.price,
                total: offer.price * qty,
            });
        }
    }

    // 6. Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const totals = { subtotal, total: subtotal }; // discount logic can go here

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
