import { env } from '../../config/env';
import { logger } from '../../security/logger';

const GA4_MP_URL = 'https://www.google-analytics.com/mp/collect';
const GA4_DEBUG_URL = 'https://www.google-analytics.com/debug/mp/collect';

interface GA4Event {
    name: string;
    params: Record<string, unknown>;
}

// Whitelist of allowed event names (server-side)
const ALLOWED_EVENTS = new Set([
    'purchase',
    'add_to_cart',
    'begin_checkout',
    'calculator_submit',
    'integration_error',
]);

/**
 * Send events to GA4 Measurement Protocol.
 * Used for server-side event tracking (e.g. purchase confirmation).
 */
export async function sendGA4Event(
    clientId: string,
    events: GA4Event[],
    debug = false,
): Promise<void> {
    const measurementId = env.GA4_MEASUREMENT_ID;
    const apiSecret = env.GA4_API_SECRET;

    if (!measurementId || !apiSecret) {
        logger.debug('GA4 not configured — skipping event', { events: events.map((e) => e.name) });
        return;
    }

    // Filter to allowed events only
    const filteredEvents = events.filter((e) => {
        if (!ALLOWED_EVENTS.has(e.name)) {
            logger.warn('GA4 event blocked (not in whitelist)', { event: e.name });
            return false;
        }
        return true;
    });

    if (filteredEvents.length === 0) return;

    const url = debug ? GA4_DEBUG_URL : GA4_MP_URL;
    const fullUrl = `${url}?measurement_id=${measurementId}&api_secret=${apiSecret}`;

    const body = {
        client_id: clientId,
        events: filteredEvents.map((e) => ({
            name: e.name,
            params: {
                ...e.params,
                ...(debug ? { debug_mode: true } : {}),
            },
        })),
    };

    try {
        const response = await fetch(fullUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
            logger.warn('GA4 MP request failed', { status: response.status });
        } else if (debug) {
            const debugResponse = await response.json();
            logger.debug('GA4 debug response', { response: debugResponse });
        }
    } catch (err) {
        // GA4 errors are non-critical — log and continue
        logger.warn('GA4 MP send failed', { error: (err as Error).message });
    }
}
