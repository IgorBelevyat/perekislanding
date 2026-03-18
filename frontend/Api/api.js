/**
 * Centralized API client for frontend-backend communication.
 */

const API_BASE = '/api';

async function fetchApi(endpoint, options = {}) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
    });

    const data = await res.json();
    if (!res.ok) {
        let errMsg = 'API Error';
        if (typeof data.error === 'string') errMsg = data.error;
        else if (data.error?.message) errMsg = data.error.message;

        const details = data.details ? ` (${JSON.stringify(data.details)})` : '';
        throw new Error(errMsg + details);
    }
    return data;
}

export const api = {
    /**
     * Fetch precalculated bundles.
     */
    getBundles: () => fetchApi('/bundles'),

    /**
     * Fetch products and bundles with real prices.
     */
    getProducts: () => fetchApi('/products'),

    /**
     * Get server-calculated quote (dose, canisters, and price).
     */
    getQuote: (quoteData) =>
        fetchApi('/quote', {
            method: 'POST',
            body: JSON.stringify(quoteData)
        }),

    /**
     * Search Nova Poshta cities by name.
     */
    searchNPCities: (query) =>
        fetchApi(`/np/cities?q=${encodeURIComponent(query)}`),

    /**
     * Get Nova Poshta warehouses for a city.
     */
    getNPWarehouses: (cityRef, query = '') =>
        fetchApi(`/np/warehouses?cityRef=${encodeURIComponent(cityRef)}&q=${encodeURIComponent(query)}`),

    /**
     * Submit checkout order.
     */
    checkout: (orderData, idempotencyKey) =>
        fetchApi('/checkout', {
            method: 'POST',
            headers: {
                'Idempotency-Key': idempotencyKey,
            },
            body: JSON.stringify(orderData)
        }),
};
