// ─── Timing constants ──────────────────
export const QUOTE_TTL_MS = 30 * 60 * 1000; // 30 minutes

// ─── Redis TTL (seconds) ───────────────
export const REDIS_TTL = {
    // RetailCRM prices cache
    RC_OFFER: 120,           // 2 min primary cache
    RC_OFFER_STALE: 3600,    // 1 hour — enables stale-while-revalidate

    // MoySklad product cache
    MS_PRODUCT: 300,         // 5 min primary cache
    MS_PRODUCT_STALE: 3600,  // 1 hour stale-while-revalidate

    // Nova Poshta
    NP_CITIES: 43200,        // 12 hours
    NP_WAREHOUSES: 21600,    // 6 hours
    NP_SEARCH: 3600,         // 1 hour

    // Idempotency
    IDEMPOTENCY: 86400,      // 24 hours

    // Rate limit window
    RATE_LIMIT_WINDOW: 600,  // 10 minutes
} as const;

// ─── Rate limit policies ──────────────
export const RATE_LIMITS = {
    '/api/checkout': { max: 10, windowSec: REDIS_TTL.RATE_LIMIT_WINDOW },
    '/api/quote': { max: 60, windowSec: REDIS_TTL.RATE_LIMIT_WINDOW },
    '/api/np': { max: 120, windowSec: REDIS_TTL.RATE_LIMIT_WINDOW },
} as const;

// ─── Calculator ────────────────────────
export const CALC = {
    MAX_LENGTH: 50,         // meters
    MAX_WIDTH: 25,
    MAX_HEIGHT: 5,
    MAX_VOLUME: 5000,       // m³
    MIN_VOLUME: 0.5,
    CANISTER_KG: 5,         // 5 kg canister
    PEROXIDE_DENSITY: 1.2,  // kg/L (ρ of 50% H2O2)
    CANISTER_LITERS: 4.17,  // 5 kg ÷ 1.2 = 4.17 L
    K_FACTORS: {
        preventive: 0.35,   // Легка очистка
        standard: 0.5,      // Стандартна очистка
        shock: 0.7,         // Інтенсивна очистка
    },
} as const;
