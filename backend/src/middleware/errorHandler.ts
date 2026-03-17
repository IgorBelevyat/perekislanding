import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/security/logger';

/**
 * Global error handler middleware.
 * Must be registered LAST in Express middleware chain.
 */
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
    const statusCode = (err as any).statusCode ?? 500;
    const isProduction = process.env.NODE_ENV === 'production';

    logger.error(`Unhandled error: ${err.message}`, {
        stack: isProduction ? undefined : err.stack,
        method: req.method,
        path: req.path,
    });

    res.status(statusCode).json({
        error: isProduction ? 'Internal server error' : err.message,
        ...(isProduction ? {} : { stack: err.stack }),
    });
}

/**
 * Wrap async route handlers to catch errors automatically.
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
    return (req: Request, res: Response, next: NextFunction): void => {
        fn(req, res, next).catch(next);
    };
}
