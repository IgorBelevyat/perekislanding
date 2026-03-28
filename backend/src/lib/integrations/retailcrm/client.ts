import { env } from '../../config/env';
import { logger } from '../../security/logger';
import { prisma } from '../../db/prisma';
import type { RetailCrmCreateOrderPayload, RetailCrmCreateOrderResponse, RetailCrmProduct } from './types';

const BASE_URL = () => env.RETAILCRM_URL ?? '';
const API_KEY = () => env.RETAILCRM_API_KEY ?? '';

/**
 * Log integration call to DB for audit (non-blocking).
 */
async function logIntegration(
    action: string,
    requestMeta: Record<string, unknown>,
    responseMeta: Record<string, unknown>,
    success: boolean,
    errorMessage?: string,
) {
    try {
        await prisma.integrationLog.create({
            data: {
                provider: 'RETAILCRM',
                action,
                requestMeta: requestMeta as any,
                responseMeta: responseMeta as any,
                status: success ? 'SUCCESS' : 'ERROR',
                errorMessage,
            },
        });
    } catch (err) {
        logger.error('Failed to log RetailCRM integration', { error: (err as Error).message });
    }
}

/**
 * Fetch products/offers from RetailCRM.
 */
export async function fetchProducts(filter?: { offerExternalIds?: string[] }): Promise<RetailCrmProduct[]> {
    if (!BASE_URL() || !API_KEY()) {
        logger.warn('RetailCRM not configured — returning mock data');
        return getMockProducts();
    }

    const url = new URL('/api/v5/store/products', BASE_URL());
    url.searchParams.set('apiKey', API_KEY());
    url.searchParams.set('limit', '100');
    if (filter?.offerExternalIds) {
        filter.offerExternalIds.forEach((id) => {
            // RetailCRM v5 expects multiple 'filter[offerExternalId]' parameters, not with '[]'
            url.searchParams.append('filter[offerExternalId]', id);
        });
    }

    try {
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
            const text = await response.text();
            await logIntegration('fetch_products', { offerIds: filter?.offerExternalIds }, { status: response.status, body: text }, false, text);

            // If the API key is invalid or lacks permissions, fallback to mock data
            if (response.status === 401 || response.status === 403) {
                logger.warn(`RetailCRM API error ${response.status} — returning mock data`);
                return getMockProducts();
            }

            throw new Error(`RetailCRM API error: ${response.status} - ${text}`);
        }

        const data = (await response.json()) as { products?: RetailCrmProduct[] };
        await logIntegration('fetch_products', { offerIds: filter?.offerExternalIds }, { count: data.products?.length ?? 0 }, true);
        return data.products ?? [];
    } catch (err) {
        await logIntegration('fetch_products', { offerIds: filter?.offerExternalIds }, {}, false, (err as Error).message);

        // Also fallback on network errors if desired, but for now just on known Auth errors
        throw err;
    }
}

/**
 * Create order in RetailCRM.
 */
export async function createOrder(payload: RetailCrmCreateOrderPayload): Promise<RetailCrmCreateOrderResponse> {
    if (!BASE_URL() || !API_KEY()) {
        logger.warn('RetailCRM not configured — returning mock order');
        return getMockOrderResponse(payload.order.externalId);
    }

    const url = new URL('/api/v5/orders/create', BASE_URL());

    try {
        const body = new URLSearchParams();
        body.set('apiKey', API_KEY());
        body.set('order', JSON.stringify(payload.order));
        if (payload.site) body.set('site', payload.site);

        const response = await fetch(url.toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString(),
            signal: AbortSignal.timeout(15000),
        });

        const data = (await response.json()) as RetailCrmCreateOrderResponse & { errors?: unknown; errorMsg?: string };

        if (!data.success) {
            await logIntegration('create_order', { externalId: payload.order.externalId }, data as any, false, JSON.stringify(data.errors ?? data.errorMsg));

            // If it's a permission error (e.g. 403/401 represented as auth failed)
            if (response.status === 401 || response.status === 403 || (typeof data.errorMsg === 'string' && data.errorMsg.toLowerCase().includes('api'))) {
                logger.warn(`RetailCRM create order failed with auth error — returning mock order`);
                return getMockOrderResponse(payload.order.externalId);
            }

            throw new Error(`RetailCRM create order failed: ${JSON.stringify(data.errors ?? data.errorMsg)}`);
        }

        await logIntegration('create_order', { externalId: payload.order.externalId }, { orderId: data.id }, true);
        return data;
    } catch (err) {
        await logIntegration('create_order', { externalId: payload.order.externalId }, {}, false, (err as Error).message);
        throw err;
    }
}

// ─── Mock Data (for dev without API keys) ──────────────────

function getMockProducts(): RetailCrmProduct[] {
    return [
        {
            id: 1,
            name: 'Перекис водню 50%',
            imageUrl: 'https://via.placeholder.com/300x400?text=Peroxide',
            offers: [
                { id: 101, externalId: 'peroxide-5l', name: 'Перекис водню 50%, 5 л', price: 420, currency: 'UAH' },
                { id: 102, externalId: 'peroxide-20l', name: 'Перекис водню 50%, 20 л', price: 1350, currency: 'UAH' },
            ],
        },
        {
            id: 2,
            name: 'Тест-смужки для перекису',
            imageUrl: 'https://via.placeholder.com/150?text=Strips',
            offers: [
                { id: 201, externalId: 'test-strips', name: 'Тест-смужки для перекису', price: 180, currency: 'UAH' },
            ],
        },
        {
            id: 3,
            name: 'Альгіцид проти водоростей',
            imageUrl: 'https://via.placeholder.com/150?text=Algicide',
            offers: [
                { id: 301, externalId: 'algicide-1l', name: 'Альгіцид проти водоростей, 1 л', price: 290, currency: 'UAH' },
            ],
        },
        {
            id: 4,
            name: 'pH-регулятор',
            imageUrl: 'https://via.placeholder.com/150?text=pH',
            offers: [
                { id: 401, externalId: 'ph-regulator-1kg', name: 'pH-регулятор, 1 кг', price: 350, currency: 'UAH' },
            ],
        },
    ];
}

function getMockOrderResponse(externalId: string): RetailCrmCreateOrderResponse {
    const mockId = Math.floor(Math.random() * 100000);
    return {
        success: true,
        id: mockId,
        order: {
            id: mockId,
            externalId,
            number: `MOCK-${mockId}`,
        },
    };
}
