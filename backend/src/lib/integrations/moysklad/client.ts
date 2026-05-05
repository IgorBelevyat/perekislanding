import { env } from '../../config/env';
import { logger } from '../../security/logger';
import type { MsProduct, MsImage } from './types';

const BASE_URL = 'https://api.moysklad.ru/api/remap/1.2';

// ─── Global concurrency limiter ─────────────────────────────────
// MoySklad limits concurrent requests; we enforce max 2 in-flight.
const MAX_CONCURRENT = 2;
let running = 0;
const queue: Array<() => void> = [];

function acquireSlot(): Promise<void> {
    if (running < MAX_CONCURRENT) {
        running++;
        return Promise.resolve();
    }
    return new Promise<void>((resolve) => queue.push(() => {
        running++;
        resolve();
    }));
}

function releaseSlot(): void {
    running--;
    if (queue.length > 0) {
        const next = queue.shift()!;
        next();
    }
}

/**
 * Low-level authenticated GET request to MoySklad API.
 * Uses Bearer token authentication.
 */
async function msApiFetch<T = unknown>(
    path: string,
    params?: Record<string, string>,
): Promise<T> {
    const token = env.MOYSKLAD_TOKEN;
    if (!token) {
        throw new Error('MOYSKLAD_TOKEN is not configured');
    }

    const url = new URL(`${BASE_URL}${path}`);
    if (params) {
        Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }

    await acquireSlot();
    let response: Response;
    try {
        response = await fetch(url.toString(), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept-Encoding': 'gzip',
                'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(5000),
        });
    } catch (err) {
        releaseSlot();
        throw err;
    }

    if (!response.ok) {
        releaseSlot();
        const text = await response.text();
        logger.error('MoySklad API error', {
            path,
            status: response.status,
            body: text.slice(0, 500),
        });
        throw new Error(`MoySklad API ${response.status}: ${text.slice(0, 200)}`);
    }

    releaseSlot();
    return response.json() as Promise<T>;
}

/**
 * Fetch a single product by its MoySklad UUID.
 */
export async function fetchProduct(moyskladId: string): Promise<MsProduct> {
    return msApiFetch<MsProduct>(`/entity/product/${moyskladId}`);
}

/**
 * Fetch product images by its MoySklad UUID.
 */
export async function fetchProductImages(moyskladId: string): Promise<MsImage[]> {
    const data = await msApiFetch<{ rows?: MsImage[] }>(`/entity/product/${moyskladId}/images`);
    return data.rows ?? [];
}

/**
 * Fetch stock report for a specific product by its MoySklad UUID.
 */
export async function fetchProductStock(moyskladId: string): Promise<number> {
    const productHref = `${BASE_URL}/entity/product/${moyskladId}`;
    const data = await msApiFetch<any>('/report/stock/all', {
        filter: `product=${productHref}`,
    });
    const rows = data.rows ?? [];
    if (rows.length > 0) {
        return rows[0].stock ?? 0;
    }
    return 0;
}

/**
 * Extract UUID from a MoySklad meta href, stripping query params.
 */
export function extractId(href: string): string {
    const withoutQuery = href.split('?')[0];
    return withoutQuery.split('/').pop() || '';
}

/**
 * Download an image from MoySklad (requires auth).
 * Returns { buffer, contentType } for proxying to the frontend.
 */
export async function fetchImageBuffer(downloadUrl: string): Promise<{
    buffer: Buffer;
    contentType: string;
}> {
    const token = env.MOYSKLAD_TOKEN;
    if (!token) throw new Error('MOYSKLAD_TOKEN is not configured');

    const response = await fetch(downloadUrl, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
        throw new Error(`MoySklad image download failed: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return {
        buffer: Buffer.from(arrayBuffer),
        contentType: response.headers.get('content-type') || 'image/jpeg',
    };
}
