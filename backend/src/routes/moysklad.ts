import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { fetchImageBuffer } from '../lib/integrations/moysklad/client';
import { getMoySkladProduct, crmOfferToMsId } from '../lib/integrations/moysklad/products';
import { getOrSet, delCache } from '../lib/cache/redis';
import { CacheKeys } from '../lib/cache/keys';
import { env } from '../lib/config/env';
import { logger } from '../lib/security/logger';

const router = Router();

/**
 * GET /api/moysklad/product-image/:offerId
 *
 * Proxies the product image from MoySklad (which requires Bearer auth).
 * The image is cached in Redis as base64 for 1 hour to minimize API calls.
 * Only the peroxide product has an image from MoySklad.
 */
router.get(
    '/product-image/:offerId',
    asyncHandler(async (req, res) => {
        const { offerId } = req.params;

        // Only serve images for known products
        if (offerId !== env.OFFER_ID_PEROXIDE) {
            res.status(404).json({ error: 'Image not found for this product' });
            return;
        }

        const cacheKey = `ms:img:${offerId}`;

        /**
         * Fetch image from MoySklad, optionally invalidating stale product cache first.
         */
        const fetchFreshImage = async (invalidateProductCache: boolean) => {
            const msId = crmOfferToMsId(offerId);
            if (!msId) return null;

            if (invalidateProductCache) {
                // Clear stale product data so we get a fresh downloadHref
                await delCache(CacheKeys.msProduct(msId));
                await delCache(`${CacheKeys.msProduct(msId)}:stale`);
            }

            const product = await getMoySkladProduct(msId);
            const imageUrl = product?.imageUrl;
            if (!imageUrl) return null;

            const { buffer, contentType } = await fetchImageBuffer(imageUrl);
            return {
                base64: buffer.toString('base64'),
                contentType,
            };
        };

        try {
            const cached = await getOrSet<{ base64: string; contentType: string } | null>(
                cacheKey,
                3600, // 1 hour
                async () => {
                    try {
                        // First try with existing (possibly cached) product data
                        return await fetchFreshImage(false);
                    } catch (firstErr) {
                        // downloadHref may have expired — invalidate product cache and retry
                        logger.warn('Image download failed, retrying with fresh product data', {
                            offerId,
                            error: (firstErr as Error).message,
                        });
                        return await fetchFreshImage(true);
                    }
                },
            );

            if (!cached) {
                res.status(404).json({ error: 'Image not available' });
                return;
            }

            const buf = Buffer.from(cached.base64, 'base64');
            res.set({
                'Content-Type': cached.contentType,
                'Content-Length': buf.length.toString(),
                'Cache-Control': 'public, max-age=3600',
            });
            res.send(buf);
        } catch (err) {
            logger.error('Failed to proxy MoySklad image', { offerId, error: (err as Error).message });
            res.status(502).json({ error: 'Failed to fetch image' });
        }
    }),
);

export default router;
