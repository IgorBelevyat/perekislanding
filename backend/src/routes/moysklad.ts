import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { fetchProductImages, fetchImageBuffer } from '../lib/integrations/moysklad/client';
import { crmOfferToMsId } from '../lib/integrations/moysklad/products';
import { getRedis } from '../lib/cache/redis';
import { env } from '../lib/config/env';
import { logger } from '../lib/security/logger';

const router = Router();

/**
 * GET /api/moysklad/product-image/:offerId
 *
 * Proxies the product image from MoySklad (which requires Bearer auth).
 * 
 * Strategy:
 *  - Cache the downloaded image bytes in Redis for 6 hours.
 *  - When cache misses, fetch a FRESH downloadHref from MoySklad images API
 *    (not from the product cache — downloadHref URLs expire!).
 *  - Never cache null/failure results.
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

        const msId = crmOfferToMsId(offerId);
        if (!msId) {
            logger.warn('No MoySklad mapping for image request', { offerId });
            res.status(404).json({ error: 'Product mapping not found' });
            return;
        }

        const cacheKey = `ms:img:${offerId}`;

        try {
            // 1) Check Redis cache for previously downloaded image bytes
            const r = getRedis();
            const cached = await r.get(cacheKey);
            if (cached) {
                try {
                    const parsed = JSON.parse(cached) as { base64: string; contentType: string };
                    if (parsed?.base64) {
                        const buf = Buffer.from(parsed.base64, 'base64');
                        res.set({
                            'Content-Type': parsed.contentType || 'image/jpeg',
                            'Content-Length': buf.length.toString(),
                            'Cache-Control': 'public, max-age=21600', // 6 hours browser cache
                        });
                        res.send(buf);
                        return;
                    }
                } catch {
                    // Corrupted cache — delete and refetch
                    await r.del(cacheKey);
                }
            }

            // 2) Cache miss — fetch fresh image directly from MoySklad API
            //    Always get a fresh downloadHref (they can expire!)
            logger.info('Fetching fresh product image from MoySklad', { offerId, msId });

            const images = await fetchProductImages(msId);
            if (!images || images.length === 0) {
                logger.warn('No images found for product in MoySklad', { offerId, msId });
                // DON'T cache this — images might appear later
                res.status(404).json({ error: 'No images available' });
                return;
            }

            // Get download URL — prefer downloadHref (full res), fallback to miniature
            const downloadUrl = images[0].meta?.downloadHref
                ?? images[0].miniature?.href;

            if (!downloadUrl) {
                logger.warn('Image entry has no downloadHref or miniature', {
                    offerId, msId,
                    imageKeys: Object.keys(images[0]),
                    metaKeys: images[0].meta ? Object.keys(images[0].meta) : [],
                });
                res.status(404).json({ error: 'Image URL not available' });
                return;
            }

            // 3) Download actual image bytes
            const { buffer, contentType } = await fetchImageBuffer(downloadUrl);

            // 4) Cache in Redis for 6 hours (image bytes, not the URL)
            await r.setex(cacheKey, 21600, JSON.stringify({
                base64: buffer.toString('base64'),
                contentType,
            }));

            // 5) Serve
            res.set({
                'Content-Type': contentType,
                'Content-Length': buffer.length.toString(),
                'Cache-Control': 'public, max-age=21600',
            });
            res.send(buffer);

        } catch (err) {
            logger.error('Failed to proxy MoySklad image', {
                offerId,
                msId,
                error: (err as Error).message,
                stack: (err as Error).stack,
            });
            res.status(502).json({ error: 'Failed to fetch image' });
        }
    }),
);

export default router;
