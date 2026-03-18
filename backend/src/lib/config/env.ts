import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
    // Server
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(4000),

    // Database
    DATABASE_URL: z.string().url(),

    // Redis
    REDIS_URL: z.string().default('redis://localhost:6379'),

    // RetailCRM
    RETAILCRM_URL: z.string().url().optional(),
    RETAILCRM_API_KEY: z.string().optional(),
    
    // RetailCRM Offer IDs
    OFFER_ID_PEROXIDE: z.string().optional(),
    OFFER_ID_TEST_STRIPS: z.string().optional(),
    OFFER_ID_MEASURING_CUP: z.string().optional(),
    
    // RetailCRM Price Types
    PRICE_TYPE_BASE: z.string().optional(),
    PRICE_TYPE_NASEZON: z.string().optional(),
    PRICE_TYPE_OPTIMAL: z.string().optional(),
    PRICE_TYPE_PRO: z.string().optional(),

    // Nova Poshta
    NP_API_KEY: z.string().optional(),

    // LiqPay
    LIQPAY_PUBLIC_KEY: z.string().optional(),
    LIQPAY_PRIVATE_KEY: z.string().optional(),

    // GA4
    GA4_MEASUREMENT_ID: z.string().optional(),
    GA4_API_SECRET: z.string().optional(),
});

// Parse and validate — crash early if invalid
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
}

export const env = parsed.data;

export type Env = z.infer<typeof envSchema>;
