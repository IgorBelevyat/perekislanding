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
            // Only peroxide in the feed
            const peroxideOfferId = env.OFFER_ID_PEROXIDE;
            if (!peroxideOfferId) {
                logger.warn('OFFER_ID_PEROXIDE not set — XML feed will be empty');
                return `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
<channel>
<title>Hlorka Market Feed</title>
<link>https://market.hlorka.ua/</link>
<description>Product feed for Hlorka Market</description>
</channel>
</rss>`;
            }

            logger.info('Fetching peroxide for XML feed', { offerId: peroxideOfferId });
            const priceMap = await getOfferPrices([peroxideOfferId]);
            const offer = priceMap.get(peroxideOfferId);

            let itemsXml = '';

            if (offer) {
                const name = offer.name || 'Перекис водню медичний 50%';
                const priceValue = offer.prices[env.PRICE_TYPE_BASE] ?? Object.values(offer.prices)[0] ?? 0;
                const currency = offer.currency || 'UAH';
                const inStock = offer.inStock ?? true;
                const rawAvail = (offer.availability ?? '').trim();
                let availability;
                if (rawAvail === '&') {
                    availability = 'preorder';
                } else if (/^\d+$/.test(rawAvail)) {
                    availability = 'backorder';
                } else {
                    availability = inStock ? 'in stock' : 'out of stock';
                }
                const productUrl = 'https://market.hlorka.ua/';
                const imageUrl = `https://market.hlorka.ua/api/moysklad/product-image/${peroxideOfferId}`;

                // Hardcoded description for peroxide
                const description = 'Перекис водню 50% (пергідроль) для очищення води у басейнах. Висококонцентрований засіб для ефективної дезінфекції, запобігання «цвітінню» води. Швидко повертає прозорість каламутній воді, не залишає специфічного запаху хлору та не подразнює шкіру при дотриманні дозування. Гарантуємо якість та чистоту продукту.';

                // TODO: replace with real GTIN (EAN-13) when received
                const gtin = '0000000000000';

                itemsXml = `
<item>
<g:id>${peroxideOfferId}</g:id>
<g:title><![CDATA[${name}]]></g:title>
<g:description><![CDATA[${description}]]></g:description>
<g:link>${productUrl}</g:link>
<g:image_link>${imageUrl}</g:image_link>
<g:availability>${availability}</g:availability>
<g:price>${priceValue} ${currency}</g:price>
<g:condition>new</g:condition>
<g:brand><![CDATA[Інтер-Синтез]]></g:brand>
<g:gtin>${gtin}</g:gtin>
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
