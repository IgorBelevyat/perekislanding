import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { getOfferPrices } from '../lib/integrations/retailcrm/prices';
import { env } from '../lib/config/env';

const router = Router();

router.get(
    '/',
    asyncHandler(async (req, res) => {
        // Collect all necessary offer IDs
        const requiredOfferIds = [
            env.OFFER_ID_PEROXIDE,
            env.OFFER_ID_TEST_STRIPS,
            env.OFFER_ID_MEASURING_CUP,
        ].filter(Boolean) as string[];

        // Fetch prices from Redis/RetailCRM
        const priceMap = await getOfferPrices(requiredOfferIds);

        const peroxide = priceMap.get(env.OFFER_ID_PEROXIDE || '');
        const strips = priceMap.get(env.OFFER_ID_TEST_STRIPS || '');
        const cup = priceMap.get(env.OFFER_ID_MEASURING_CUP || '');

        // Fallback generic info if no data is found
        const peroxideBasePrice = peroxide?.prices['base'] ?? 420;
        const stripsBasePrice = strips?.prices['base'] ?? 180;
        const cupBasePrice = cup?.prices['base'] ?? 150;

        // Helper to calculate a bundle package
        const calculateBundle = (
            id: string,
            title: string,
            subtitle: string,
            type: string,
            peroxideQty: number,
            priceType: string,
            includesStrips: boolean,
            includesCup: boolean,
            isPopular: boolean = false
        ) => {
            let baseTotal = peroxideQty * peroxideBasePrice;
            let actualTotal = peroxideQty * (peroxide?.prices[priceType] ?? peroxideBasePrice);
            
            let descriptionItems = [`${peroxideQty} × 5 кг`];
            const customItems = [
                { 
                    offerId: peroxide?.offerId || 'per', 
                    qty: peroxideQty,
                    name: `Перекис водню 50%`,
                    price: peroxide?.prices[priceType] ?? peroxideBasePrice,
                    basePrice: peroxideBasePrice
                }
            ];

            if (includesStrips) {
                baseTotal += stripsBasePrice;
                const activePrice = strips?.prices[priceType] ?? stripsBasePrice;
                actualTotal += activePrice;
                descriptionItems.push('🎁 тест-смужки');
                customItems.push({ 
                    offerId: strips?.offerId || 'str', 
                    qty: 1,
                    name: 'Тест-смужки для перекису',
                    price: activePrice,
                    basePrice: stripsBasePrice
                });
            }

            if (includesCup) {
                baseTotal += cupBasePrice;
                const activePrice = cup?.prices[priceType] ?? cupBasePrice;
                actualTotal += activePrice;
                descriptionItems.push('мірна тара');
                customItems.push({ 
                    offerId: cup?.offerId || 'cup', 
                    qty: 1,
                    name: 'Мірна тара',
                    price: activePrice,
                    basePrice: cupBasePrice
                });
            }

            // Benefit = savings on peroxide only (other items not counted)
            const peroxideBundlePrice = peroxide?.prices[priceType] ?? peroxideBasePrice;
            const benefit = (peroxideBasePrice * peroxideQty) - (peroxideBundlePrice * peroxideQty);

            return {
                id,
                title,
                subtitle,
                type, // used for styling/tracking
                description: descriptionItems.join(' + '),
                price: actualTotal,
                basePrice: baseTotal,
                benefit: benefit > 0 ? benefit : 0,
                isPopular,
                customItems // payload for the cart
            };
        };

        const bundles = [
            calculateBundle(
                'nasezon',
                'На сезон',
                'Для басейнів до 15 м³',
                'minimal',
                4,
                env.PRICE_TYPE_NASEZON || 'base',
                true,
                false
            ),
            calculateBundle(
                'optimal',
                'Оптимальний вибір',
                'Для басейнів до 10 м³',
                'optimal',
                2,
                env.PRICE_TYPE_OPTIMAL || 'base',
                false,
                false,
                true
            ),
            calculateBundle(
                'pro',
                'PRO запас',
                'Для басейнів від 15 м³',
                'maximum',
                6,
                env.PRICE_TYPE_PRO || 'base',
                true,
                true
            )
        ];

        res.json({ bundles });
    }),
);

export default router;
