import { Router } from 'express';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/errorHandler';
import { quoteRequestSchema } from '../lib/validation/quote.schema';
import { buildQuote } from '../lib/domain/pricing/buildQuote';

const router = Router();

/**
 * POST /api/quote
 * Server-side calculator + price snapshot.
 * Returns quoteId, items, totals, expiresAt.
 */
router.post(
    '/',
    validate(quoteRequestSchema),
    asyncHandler(async (req, res) => {
        const result = await buildQuote(req.body);
        res.status(201).json(result);
    }),
);

export default router;
