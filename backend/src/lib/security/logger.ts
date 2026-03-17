import { env } from '../config/env';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: string;
    data?: Record<string, unknown>;
}

/**
 * Mask sensitive data in log output
 */
function maskSensitive(data: Record<string, unknown>): Record<string, unknown> {
    const masked = { ...data };
    const sensitiveKeys = ['phone', 'email', 'password', 'apiKey', 'api_key', 'secret', 'token', 'signature'];

    for (const key of Object.keys(masked)) {
        const lowerKey = key.toLowerCase();
        if (sensitiveKeys.some((s) => lowerKey.includes(s))) {
            const val = String(masked[key] ?? '');
            if (val.length > 4) {
                masked[key] = val.slice(0, 3) + '***' + val.slice(-2);
            } else {
                masked[key] = '***';
            }
        }

        // Recursively mask nested objects
        if (masked[key] && typeof masked[key] === 'object' && !Array.isArray(masked[key])) {
            masked[key] = maskSensitive(masked[key] as Record<string, unknown>);
        }
    }

    return masked;
}

function formatEntry(entry: LogEntry): string {
    const base = `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`;
    if (entry.data && Object.keys(entry.data).length > 0) {
        return `${base} ${JSON.stringify(maskSensitive(entry.data))}`;
    }
    return base;
}

function log(level: LogLevel, message: string, data?: Record<string, unknown>) {
    // Skip debug in production
    if (level === 'debug' && env.NODE_ENV === 'production') return;

    const entry: LogEntry = {
        level,
        message,
        timestamp: new Date().toISOString(),
        data,
    };

    const formatted = formatEntry(entry);

    switch (level) {
        case 'error':
            console.error(formatted);
            break;
        case 'warn':
            console.warn(formatted);
            break;
        default:
            console.log(formatted);
    }
}

export const logger = {
    info: (msg: string, data?: Record<string, unknown>) => log('info', msg, data),
    warn: (msg: string, data?: Record<string, unknown>) => log('warn', msg, data),
    error: (msg: string, data?: Record<string, unknown>) => log('error', msg, data),
    debug: (msg: string, data?: Record<string, unknown>) => log('debug', msg, data),
};
