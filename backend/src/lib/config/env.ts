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
    OFFER_ID_TEST_STRIPS: z.string().optional(),
    OFFER_ID_MEASURING_CUP: z.string().optional(),
    
    // Pricing configuration
    OFFER_ID_PEROXIDE: z.string().optional().default('101'),
    PRICE_TYPE_BASE: z.string().optional().default('base'),
    PRICE_TYPE_NASEZON: z.string().optional().default('base'),
    PRICE_TYPE_OPTIMAL: z.string().optional().default('base'),
    PRICE_TYPE_PRO: z.string().optional().default('base'),

    // CRM Payment Types
    CRM_PAYMENT_TYPE_ONLINE: z.string().optional().default('liqpay'),
    CRM_PAYMENT_TYPE_COD: z.string().optional().default('cash-on-delivery'),
    CRM_PAYMENT_TYPE_CASHLESS: z.string().optional().default('bank-transfer'),

    // CRM Delivery Types
    CRM_DELIVERY_TYPE_NP: z.string().optional().default('novaposhta'),
    CRM_DELIVERY_TYPE_COURIER: z.string().optional().default('courier'),
    CRM_DELIVERY_TYPE_PICKUP: z.string().optional().default('pickup'),
    CRM_NP_INTEGRATION_CODE: z.string().optional(), // e.g. 'newpost_new_0'
    CRM_SITE_CODE: z.string().optional(),

    // Nova Poshta
    NP_API_KEY: z.string().optional(),

    // LiqPay
    LIQPAY_PUBLIC_KEY: z.string().optional(),
    LIQPAY_PRIVATE_KEY: z.string().optional(),

    // Frontend URL (for payment redirects)
    SITE_URL: z.string().url().optional().default('http://localhost:3000'),

    // GA4
    GA4_MEASUREMENT_ID: z.string().optional(),
    GA4_API_SECRET: z.string().optional(),

    // MoySklad
    MOYSKLAD_TOKEN: z.string().optional(),
    MOYSKLAD_ID_PEROXIDE: z.string().optional(),
    MOYSKLAD_ID_TEST_STRIPS: z.string().optional(),
    MOYSKLAD_ID_MEASURING_CUP: z.string().optional(),
    MOYSKLAD_PRICE_ROZNICA: z.string().optional(),
    MOYSKLAD_PRICE_TEST_LIFE: z.string().optional(),
    MOYSKLAD_PRICE_AKCIA: z.string().optional(),
    MOYSKLAD_PRICE_OPT: z.string().optional(),
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
