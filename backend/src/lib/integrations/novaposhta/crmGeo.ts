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

        const data = (await response.json()) as Record<string, unknown>;

        if (data.cityId && data.regionId) {
            logger.info('CRM geo IDs fetched', { cityRef, cityId: data.cityId, regionId: data.regionId });
            return { cityId: Number(data.cityId), regionId: Number(data.regionId) };
        }

        // Try alternative response shapes
        if (data.city_id && data.region_id) {
            logger.info('CRM geo IDs fetched (alt)', { cityRef, cityId: data.city_id, regionId: data.region_id });
            return { cityId: Number(data.city_id), regionId: Number(data.region_id) };
        }

        logger.warn('state13 geo API returned unexpected shape', { cityRef, data });
        return null;
    } catch (err) {
        logger.error('state13 geo API call failed', { cityRef, error: (err as Error).message });
        return null;
    }
}
