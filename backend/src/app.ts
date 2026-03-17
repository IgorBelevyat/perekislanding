import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { rateLimitMiddleware } from './lib/security/rateLimit';
import { errorHandler } from './middleware/errorHandler';
import { env } from './lib/config/env';

// Routes
import quoteRouter from './routes/quote';
import npRouter from './routes/np';
import checkoutRouter from './routes/checkout';
import paymentsRouter from './routes/payments';
import healthRouter from './routes/health';
import productsRouter from './routes/products';

const app = express();

// ─── Security ──────────────────────────────────────────────
app.use(helmet({
    contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
}));

// Trust proxy (Nginx)
app.set('trust proxy', 1);

// ─── Body parsing ──────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── CORS (only needed for dev — production is same-origin) ──
if (env.NODE_ENV === 'development') {
    app.use(cors({
        origin: ['http://localhost:5173', 'http://localhost:3000'],
        credentials: true,
    }));
}

// ─── Logging ───────────────────────────────────────────────
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Rate limiting (Redis-based) ───────────────────────────
app.use('/api', rateLimitMiddleware());

// ─── API Routes ────────────────────────────────────────────
app.use('/api/quote', quoteRouter);
app.use('/api/np', npRouter);
app.use('/api/checkout', checkoutRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/products', productsRouter);
app.use('/api/health', healthRouter);

// ─── 404 for unknown API routes ────────────────────────────
app.use('/api/*', (_req, res) => {
    res.status(404).json({ error: 'API route not found' });
});

// ─── Global error handler (must be last) ───────────────────
app.use(errorHandler);

export default app;
