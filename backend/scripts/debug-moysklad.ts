/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Debug script to test MoySklad (Мой Склад) API connection
 * and explore product structure, images, names, and prices.
 *
 * Run: npx tsx scripts/debug-moysklad.ts
 *
 * MoySklad JSON API 1.2:
 *   https://dev.moysklad.ru/doc/api/remap/1.2/
 *   Auth: Bearer token
 *   Products: GET /entity/product
 *   Images: GET /entity/product/{id}/images
 *   Stock: GET /report/stock/all
 */

// ─── Config (hardcoded for debug) ─────────────────────────────
let MOYSKLAD_TOKEN: string = '515daa0c4545616c60afbeaf712e3eb40a365bb7';

// Real price type IDs from MoySklad API (from /context/companysettings/pricetype)
const PRICE_TYPE_IDS: Record<string, string> = {
    'Розница': '594518c6-c1a3-11e8-9109-f8fc0037082f',
    'Тест Лайф': '01c13566-f730-11e8-912f-f3d400001c97',
    'Акционная цена': 'c149819c-f72f-11e8-9ff4-34e8001d38de',
    'ОПТ': '3abf5185-4e9d-11ec-0a80-000c00096dbd',
};

const BASE_URL = 'https://api.moysklad.ru/api/remap/1.2';

// ─── Helpers ──────────────────────────────────────────────────

async function msApiFetch(path: string, params?: Record<string, string>): Promise<any> {
    const url = new URL(`${BASE_URL}${path}`);
    if (params) {
        Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }

    const response = await fetch(url.toString(), {
        headers: {
            'Authorization': `Bearer ${MOYSKLAD_TOKEN}`,
            'Accept-Encoding': 'gzip',
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`MoySklad API ${response.status}: ${text}`);
    }

    return response.json();
}

/** Extract UUID from MoySklad href, stripping query params */
function extractId(href: string): string {
    const withoutQuery = href.split('?')[0]; // Remove ?expand=... etc.
    return withoutQuery.split('/').pop() || '';
}

// ─── Main ─────────────────────────────────────────────────────

async function main() {
    console.log('=== MoySklad Debug ===');
    console.log('Token:', MOYSKLAD_TOKEN !== 'ВСТАВТЕ_ТОКЕН_СЮДИ'
        ? `${MOYSKLAD_TOKEN.slice(0, 8)}...`
        : '❌ НЕ ВСТАНОВЛЕНО — заміни ВСТАВТЕ_ТОКЕН_СЮДИ в скрипті');
    console.log('');

    if (MOYSKLAD_TOKEN === 'ВСТАВТЕ_ТОКЕН_СЮДИ') {
        console.error('❌ Встав реальний токен в змінну MOYSKLAD_TOKEN');
        return;
    }

    // Target product IDs
    const PRODUCTS: Record<string, string> = {
        'Перекис': 'a7a0514f-c252-11e8-9ff4-31500014f188',
        'Тара':    '0f5bfe04-29ea-11f1-0a80-16d100270ffc',
        'Тести':   '2782b70a-29eb-11f1-0a80-138c00276242',
    };

    // Known CRM external IDs for comparison
    const CRM_CODES: Record<string, string> = {
        'Перекис': '337674164',
        'Тара':    '564654656',
        'Тести':   '654654647',
    };

    // Fetch stock — index by product ID, externalCode, article, and name
    let stockById: Record<string, number> = {};
    let stockByCode: Record<string, number> = {};
    let stockByArticle: Record<string, number> = {};
    let stockRawByName: Record<string, any> = {};
    try {
        console.log('📡 Fetching stock levels...\n');
        const stockData: any = await msApiFetch('/report/stock/all', { limit: '1000' });
        for (const row of (stockData.rows ?? [])) {
            const productHref = row.meta?.href ?? '';
            const productId = extractId(productHref);
            const qty = row.quantity ?? row.stock ?? 0;

            if (productId) stockById[productId] = qty;
            if (row.externalCode) stockByCode[row.externalCode] = qty;
            if (row.article) stockByArticle[row.article] = qty;
            if (row.code) stockByCode[row.code] = qty;

            // Save raw rows for our target product IDs for debugging
            const targetIds = Object.values(PRODUCTS);
            if (targetIds.includes(productId)) {
                stockRawByName[row.name ?? productId] = {
                    quantity: row.quantity,
                    stock: row.stock,
                    reserve: row.reserve,
                    inTransit: row.inTransit,
                    name: row.name,
                    code: row.code,
                    article: row.article,
                    externalCode: row.externalCode,
                    href: productHref,
                };
            }
        }
        console.log(`Loaded stock data for ${Object.keys(stockById).length} items\n`);

        // Print raw stock rows for our products
        if (Object.keys(stockRawByName).length > 0) {
            console.log('🔍 Raw stock rows for our products:');
            for (const [name, raw] of Object.entries(stockRawByName)) {
                console.log(`   ${name}: ${JSON.stringify(raw)}`);
            }
            console.log('');
        } else {
            console.log('⚠️ None of our 3 products found in stock report!\n');
            // Show first 3 stock entries for debugging
            const stockData2: any = await msApiFetch('/report/stock/all', { limit: '3' });
            console.log('   Sample stock rows for reference:');
            for (const row of (stockData2.rows ?? [])) {
                console.log(`   ${JSON.stringify({ name: row.name, id: extractId(row.meta?.href ?? ''), href: row.meta?.href, quantity: row.quantity, stock: row.stock, keys: Object.keys(row) })}`);
            }
            console.log('');
        }
    } catch (stockErr) {
        console.log(`⚠️ Could not fetch stock: ${(stockErr as Error).message}\n`);
    }

    // Fetch each product individually
    for (const [label, productId] of Object.entries(PRODUCTS)) {
        try {
            console.log('═'.repeat(60));
            console.log(`📡 Fetching [${label}] id=${productId}...\n`);

            const product: any = await msApiFetch(`/entity/product/${productId}`);

            // Try to find stock from various indexes
            const stock = stockById[productId]
                ?? (product.article ? stockByArticle[product.article] : undefined)
                ?? (product.externalCode ? stockByCode[product.externalCode] : undefined);

            const crmCode = CRM_CODES[label];

            console.log(`📦 Product: ${product.name}`);
            console.log(`   ID:          ${productId}`);
            console.log(`   externalCode: ${product.externalCode ?? '(empty)'}  ${product.externalCode === crmCode ? '✅ MATCHES CRM' : ''}`);
            console.log(`   article:      ${product.article ?? '(empty)'}  ${product.article === crmCode ? '✅ MATCHES CRM' : ''}`);
            console.log(`   code:         ${product.code ?? '(empty)'}  ${product.code === crmCode ? '✅ MATCHES CRM' : ''}`);
            console.log(`   CRM code:     ${crmCode}`);
            console.log(`   description:  ${(product.description ?? '(empty)').slice(0, 100)}`);
            console.log(`   archived:     ${product.archived ?? false}`);
            console.log(`   📦 Stock:     ${stock !== undefined ? stock : '⚠️ NOT FOUND in stock report'}`);

            // Attributes
            if (product.attributes && product.attributes.length > 0) {
                console.log(`   📋 Attributes (${product.attributes.length}):`);
                for (const attr of product.attributes) {
                    const name = attr.name ?? attr.id;
                    const value = attr.value?.name ?? attr.value ?? '(empty)';
                    const isSupplierName = (attr.name ?? '').toLowerCase().includes('наименование') ||
                        (attr.name ?? '').toLowerCase().includes('поставщик');
                    const marker = isSupplierName ? ' ⭐ <-- SUPPLIER NAME' : '';
                    console.log(`      - [${name}] = ${value}${marker}`);
                }
            } else {
                console.log('   📋 Attributes: (none)');
            }

            // Images
            const imagesMeta = product.images?.meta;
            if (imagesMeta && imagesMeta.size > 0) {
                console.log(`   🖼️  Images: ${imagesMeta.size}`);
                try {
                    const imagesData: any = await msApiFetch(`/entity/product/${productId}/images`);
                    for (const img of (imagesData.rows ?? [])) {
                        const imgUrl = img.miniature?.href ?? img.meta?.downloadHref ?? '(no URL)';
                        console.log(`      - ${img.filename}: ${imgUrl}`);
                    }
                } catch (imgErr) {
                    console.log(`      ❌ Failed to fetch images: ${(imgErr as Error).message}`);
                }
            } else {
                console.log('   🖼️  Images: (none)');
            }

            // Sale prices
            if (product.salePrices && product.salePrices.length > 0) {
                console.log('   💰 Prices:');
                for (const sp of product.salePrices) {
                    const priceTypeId = extractId(sp.priceType?.meta?.href ?? '');
                    const priceTypeName = sp.priceType?.name ?? priceTypeId;
                    const priceValue = (sp.value ?? 0) / 100;
                    const isOurs = Object.values(PRICE_TYPE_IDS).includes(priceTypeId);
                    const marker = isOurs ? ' ✅' : '';
                    console.log(`      - [${priceTypeName}] ${priceValue} грн (id: ${priceTypeId})${marker}`);
                }
            } else {
                console.log('   💰 Prices: (none)');
            }

            console.log('');
        } catch (err) {
            console.error(`❌ Failed to fetch [${label}] (${productId}): ${(err as Error).message}\n`);
        }
    }

    // 2. Quick check: list all price types to verify IDs
    console.log('\n' + '═'.repeat(60));
    console.log('📊 All price types in MoySklad:');
    try {
        const priceTypes: any = await msApiFetch('/context/companysettings/pricetype');
        for (const pt of (priceTypes ?? [])) {
            const ptId = extractId(pt.meta?.href ?? '');
            const isOurs = Object.values(PRICE_TYPE_IDS).includes(ptId);
            const marker = isOurs ? ' ✅ НАША' : '';
            console.log(`   - [${pt.name}] id: ${ptId}${marker}`);
        }
    } catch (err) {
        console.error('   ❌ Failed to fetch price types:', (err as Error).message);
    }
}

main().catch(err => {
    console.error('Fatal:', err);
});
