// ─── Redis key builders ────────────────────────────────────
// All keys centralized here to prevent typos and collisions

export const CacheKeys = {
    // RetailCRM offer prices
    rcOffer: (offerId: string) => `rc:offer:${offerId}`,

    // Nova Poshta
    npCities: (query: string) => `np:cities:q:${query.toLowerCase().trim()}`,
    npWarehouses: (cityRef: string) => `np:warehouses:city:${cityRef}`,
    npWarehouseSearch: (cityRef: string, query: string) =>
        `np:warehouses:city:${cityRef}:q:${query.toLowerCase().trim()}`,

    // Rate limiting
    rateLimit: (ip: string, route: string) => `rl:${ip}:${route}`,

    // Idempotency
    idempotency: (key: string) => `idem:checkout:${key}`,
} as const;
