import { z } from 'zod';
import { CALC } from '../config/constants';

// ─── Dimensions input (L × W × H) ────────────────────────
const dimensionsInput = z.object({
    L: z.number().positive().max(CALC.MAX_LENGTH),
    W: z.number().positive().max(CALC.MAX_WIDTH),
    H: z.number().positive().max(CALC.MAX_HEIGHT),
});

// ─── Volume input (direct) ────────────────────────────────
const volumeInput = z.object({
    V: z.number().positive().max(CALC.MAX_VOLUME),
});

// ─── Quote request schema ─────────────────────────────────
export const quoteRequestSchema = z.object({
    bundleId: z.string().min(1).max(100).optional(),
    calcInput: z.union([dimensionsInput, volumeInput]).optional(),
    k: z.number().optional(),
    includeAddons: z.boolean().default(true),
    addonSelection: z.array(z.string()).optional(),
    // Used for cart checkout
    customItems: z.array(z.object({
        offerId: z.string(),
        qty: z.number().int().positive(),
        isBundleItem: z.boolean().optional(),
        bundleId: z.string().optional(),
        bundleTitle: z.string().optional(),
        isGift: z.boolean().optional(),
    })).optional(),
});

export type QuoteRequest = z.infer<typeof quoteRequestSchema>;
