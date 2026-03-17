import { Router } from 'express';
import { fetchProducts } from '../lib/integrations/retailcrm/client';
import { getOrSet } from '../lib/cache/redis';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../lib/security/logger';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
    // Cache for 15 minutes, stale-while-revalidate
    const cacheKey = 'rc:all_products';

    const products = await getOrSet(
        cacheKey,
        900, // 15 mins (ttlSec)
        async () => {
            logger.info('Fetching products from RetailCRM for /api/products');
            const data = await fetchProducts();

            // Flatten the products into a simple list of offers for the frontend
            const offers = data.flatMap(p =>
                p.offers.map(o => ({
                    id: o.externalId || String(o.id), // fallback to internal id
                    name: o.name,
                    price: o.price || 0,
                    currency: o.currency || 'UAH',
                    productId: p.id,
                    imageUrl: (o.images && o.images.length > 0) ? o.images[0] : (p.imageUrl || null),
                }))
            );
            return offers;
        },
        300 // staleTtlSec (5 mins)
    );

    res.json({ products });
}));

export default router;
