import { logger } from '../../security/logger';

const STATE13_GEO_URL = 'https://dev.state13.xyz/newpost/get_geo_ids_by_ref/';

export interface CrmGeoIds {
    cityId: number;
    regionId: number;
}

/**
 * Fetch CRM-specific cityId and regionId by Nova Poshta cityRef.
 *
 * The RetailCRM NP integration requires its own internal geo IDs
 * (not NP refs) in delivery.address.cityId / regionId.
 * This endpoint is provided by the CRM integration team (state13).
 */
export async function getCrmGeoIds(cityRef: string): Promise<CrmGeoIds | null> {
    try {
        const response = await fetch(STATE13_GEO_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `cityRef=${encodeURIComponent(cityRef)}`,
            signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
            logger.error('state13 geo API HTTP error', { status: response.status, cityRef });
            return null;
        }

        const raw = await response.json();

        // API returns nested array: [[{cityId, regionId, cityName, ...}, ...]]
        // First entry is usually the Ukrainian locale — that's what we need.
        let entry: Record<string, unknown> | null = null;

        if (Array.isArray(raw) && Array.isArray(raw[0]) && raw[0].length > 0) {
            // Nested array shape: [[{...}, {...}]]
            entry = raw[0][0] as Record<string, unknown>;
        } else if (Array.isArray(raw) && raw.length > 0 && !Array.isArray(raw[0])) {
            // Flat array shape: [{...}, {...}]
            entry = raw[0] as Record<string, unknown>;
        } else if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
            // Flat object shape: {cityId, regionId}
            entry = raw as Record<string, unknown>;
        }

        if (entry && entry.cityId && entry.regionId) {
            logger.info('CRM geo IDs fetched', { cityRef, cityId: entry.cityId, regionId: entry.regionId });
            return { cityId: Number(entry.cityId), regionId: Number(entry.regionId) };
        }

        logger.warn('state13 geo API: could not extract cityId/regionId', { cityRef, raw });
        return null;
    } catch (err) {
        logger.error('state13 geo API call failed', { cityRef, error: (err as Error).message });
        return null;
    }
}
