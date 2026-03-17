import { z } from 'zod';

export const citiesQuerySchema = z.object({
    q: z.string().min(1).max(100).trim(),
});

export const warehousesQuerySchema = z.object({
    cityRef: z.string().min(1).max(100),
    q: z.string().max(200).optional(),
});

export type CitiesQuery = z.infer<typeof citiesQuerySchema>;
export type WarehousesQuery = z.infer<typeof warehousesQuerySchema>;
