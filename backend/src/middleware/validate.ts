import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Generic Zod validation middleware.
 * Validates req.body (POST) or req.query (GET) against the provided schema.
 */
export function validate(schema: ZodSchema, source: 'body' | 'query' = 'body') {
    return (req: Request, res: Response, next: NextFunction): void => {
        const data = source === 'body' ? req.body : req.query;
        const result = schema.safeParse(data);

        if (!result.success) {
            const errors = result.error.flatten();
            res.status(400).json({
                error: 'Validation failed',
                details: errors.fieldErrors,
            });
            return;
        }

        // Replace with parsed data (includes transforms, defaults)
        if (source === 'body') {
            req.body = result.data;
        } else {
            (req as any).validatedQuery = result.data;
        }

        next();
    };
}
