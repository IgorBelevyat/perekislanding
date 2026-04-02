import { Router } from 'express';
import { getOfferPrices } from '../lib/integrations/retailcrm/prices';
import { getOrSet } from '../lib/cache/redis';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../lib/security/logger';
import { env } from '../lib/config/env';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
    const cacheKey = 'rc:all_products';

    const products = await getOrSet(
        cacheKey,
        900, // 15 mins
        async () => {
            const requiredOfferIds = [
                env.OFFER_ID_PEROXIDE,
                env.OFFER_ID_TEST_STRIPS,
                env.OFFER_ID_MEASURING_CUP,
            ].filter(Boolean) as string[];

            logger.info('Fetching products for /api/products', { offerIds: requiredOfferIds });
            const priceMap = await getOfferPrices(requiredOfferIds);

            const offers = Array.from(priceMap.entries()).map(([id, offer]) => ({
                id,
                name: offer.name,
                isMainProduct: id === env.OFFER_ID_PEROXIDE,
                price: offer.prices[env.PRICE_TYPE_BASE] ?? Object.values(offer.prices)[0] ?? 0,
                currency: offer.currency || 'UAH',
                // Use proxy URL — MoySklad images require auth
                imageUrl: offer.imageUrl ? `/api/moysklad/product-image/${id}` : null,
                inStock: offer.inStock ?? true,
                availability: offer.availability ?? '',
            }));

            return offers;
        },
        300 // staleTtlSec (5 mins)
    );

    res.json({ products });
}));

export default router;
