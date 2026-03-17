import { Router } from 'express';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/errorHandler';
import { citiesQuerySchema, warehousesQuerySchema } from '../lib/validation/np.schema';
import { searchCities } from '../lib/integrations/novaposhta/cities';
import { getWarehouses } from '../lib/integrations/novaposhta/warehouses';

const router = Router();

/**
 * GET /api/np/cities?q=...
 * Search cities by name. Results cached for 12–24 hours.
 */
router.get(
    '/cities',
    validate(citiesQuerySchema, 'query'),
    asyncHandler(async (req, res) => {
        const { q } = (req as any).validatedQuery;
        const cities = await searchCities(q);
        res.json({ cities });
    }),
);

/**
 * GET /api/np/warehouses?cityRef=...&q=...
 * Get warehouses for a city. Optional search query filters locally.
 */
router.get(
    '/warehouses',
    validate(warehousesQuerySchema, 'query'),
    asyncHandler(async (req, res) => {
        const { cityRef, q } = (req as any).validatedQuery;
        const warehouses = await getWarehouses(cityRef, q);
        res.json({ warehouses });
    }),
);

export default router;
