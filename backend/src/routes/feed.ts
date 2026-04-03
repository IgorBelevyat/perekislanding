import { Router } from 'express';
import { getOfferPrices } from '../lib/integrations/retailcrm/prices';
import { getOrSet } from '../lib/cache/redis';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../lib/security/logger';
import { env } from '../lib/config/env';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
    const cacheKey = 'rc:xml_feed';

    const xml = await getOrSet(
        cacheKey,
        86400, // 24 hours
        async () => {
            const requiredOfferIds = [
                env.OFFER_ID_PEROXIDE,
                env.OFFER_ID_TEST_STRIPS,
                env.OFFER_ID_MEASURING_CUP,
            ].filter(Boolean) as string[];

            logger.info('Fetching products for XML feed', { offerIds: requiredOfferIds });
            const priceMap = await getOfferPrices(requiredOfferIds);

            let itemsXml = '';

            for (const [id, offer] of priceMap.entries()) {
                const name = offer.name || 'Товар';
                const priceValue = offer.prices[env.PRICE_TYPE_BASE] ?? Object.values(offer.prices)[0] ?? 0;
                const currency = offer.currency || 'UAH';
                const inStock = offer.inStock ?? true;
                const rawAvail = (offer.availability ?? '').trim();
                // Google Merchant availability values: "in stock", "out of stock", "preorder", "backorder"
                let availability;
                if (rawAvail === '&') {
                    availability = 'preorder';
                } else if (/^\d+$/.test(rawAvail)) {
                    availability = 'backorder';
                } else {
                    availability = inStock ? 'in stock' : 'out of stock';
                }
                const productUrl = 'https://market.hlorka.ua/';
                const imageUrl = `https://market.hlorka.ua/api/moysklad/product-image/${id}`;

                itemsXml += `
<item>
<g:id>${id}</g:id>
<g:title><![CDATA[${name}]]></g:title>
<g:link>${productUrl}</g:link>
<g:image_link>${imageUrl}</g:image_link>
<g:availability>${availability}</g:availability>
<g:price>${priceValue} ${currency}</g:price>
<g:condition>new</g:condition>
</item>`;
            }

            return `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
<channel>
<title>Hlorka Market Feed</title>
<link>https://market.hlorka.ua/</link>
<description>Product feed for Hlorka Market</description>${itemsXml}
</channel>
</rss>`;
        },
        43200 // stale after 12 hrs
    );

    res.type('application/xml');
    res.send(xml);
}));

export default router;
