/**
 * Quick debug script to test RetailCRM API connection
 * and see product structure.
 * Run: npx tsx scripts/debug-retailcrm.ts
 */
import 'dotenv/config';

const BASE_URL = process.env.RETAILCRM_URL?.replace(/\/+$/, ''); // remove trailing slash
const API_KEY = process.env.RETAILCRM_API_KEY;

async function main() {
    console.log('=== RetailCRM Debug ===');
    console.log('URL:', BASE_URL);
    console.log('API Key:', API_KEY ? `${API_KEY.slice(0, 6)}...` : 'NOT SET');
    console.log('');

    if (!BASE_URL || !API_KEY) {
        console.error('❌ RETAILCRM_URL or RETAILCRM_API_KEY not set in .env');
        process.exit(1);
    }

    // Test connection
    try {
        const url = `${BASE_URL}/api/v5/store/products?apiKey=${API_KEY}&limit=100`;
        console.log('Fetching:', url.replace(API_KEY, '***'));

        const response = await fetch(url);
        console.log('Status:', response.status, response.statusText);

        if (!response.ok) {
            const text = await response.text();
            console.error('❌ Error response:', text);
            return;
        }

        const data = await response.json();
        console.log('Success:', data.success);
        console.log('Products count:', data.products?.length ?? 0);
        console.log('');

        // Show each product with its offers
        for (const product of (data.products ?? [])) {
            // Фільтруємо товар і його офери за ІД 337674164
            const isMatch = product.externalId === '337674164' || product.offers?.some((o: any) => o.externalId === '337674164');
            if (!isMatch) continue;

            console.log(`📦 Product #${product.id}: ${product.name}`);
            console.log(`   externalId: ${product.externalId ?? '(empty)'}`);
            console.log(`   article: ${product.article ?? '(empty)'}`);

            for (const offer of (product.offers ?? [])) {
                console.log(`   └─ Offer #${offer.id}: ${offer.name}`);
                console.log(`      externalId: ${offer.externalId ?? '(empty)'}`);
                console.log(`      xmlId: ${offer.xmlId ?? '(empty)'}`);
                console.log(`      article: ${offer.article ?? '(empty)'}`);
                if (offer.prices && offer.prices.length > 0) {
                    console.log(`      prices:`);
                    for (const p of offer.prices) {
                        console.log(`         - [${p.priceType}] ${p.price}`);
                    }
                } else {
                    console.log(`      price: ${offer.price ?? '?'}`);
                }
            }
            console.log('');
        }
    } catch (err) {
        console.error('❌ Connection failed:', (err as Error).message);
    }
}

main();
