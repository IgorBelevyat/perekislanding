import { Router } from 'express';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/errorHandler';
import { idempotencyMiddleware } from '../lib/security/idempotency';
import { checkoutRequestSchema } from '../lib/validation/checkout.schema';
import { processCheckout } from '../lib/domain/checkout/createCheckout';

const router = Router();

/**
 * POST /api/checkout
 * Full checkout: quote → validate → RetailCRM → order → payment.
 * Requires Idempotency-Key header (UUID).
 */
router.post(
    '/',
    idempotencyMiddleware(),
    validate(checkoutRequestSchema),
    asyncHandler(async (req, res) => {
        const idempotencyKey = (req as any).idempotencyKey as string;
        const result = await processCheckout(req.body, idempotencyKey);
        res.status(201).json(result);
    }),
);

export default router;
