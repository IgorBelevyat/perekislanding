import { createHash } from 'crypto';
import { env } from '../../config/env';
import { logger } from '../../security/logger';
import type { LiqPayCallbackData } from './types';

/**
 * Verify LiqPay callback signature.
 * CRITICAL: must validate signature before trusting any callback data.
 */
export function verifySignature(data: string, signature: string): boolean {
    const privateKey = env.LIQPAY_PRIVATE_KEY ?? '';
    const signString = privateKey + data + privateKey;
    const expectedSignature = createHash('sha1').update(signString).digest('base64');

    const isValid = expectedSignature === signature;

    if (!isValid) {
        logger.warn('LiqPay signature verification failed', {
            expected: expectedSignature.slice(0, 10) + '...',
            received: signature.slice(0, 10) + '...',
        });
    }

    return isValid;
}

/**
 * Decode base64 LiqPay callback data.
 */
export function decodeCallbackData(dataBase64: string): LiqPayCallbackData {
    const decoded = Buffer.from(dataBase64, 'base64').toString('utf-8');
    return JSON.parse(decoded) as LiqPayCallbackData;
}

/**
 * Check if the payment status indicates a successful payment.
 * LiqPay docs: https://www.liqpay.ua/documentation/api/callback
 */
export function isPaymentSuccessful(status: string): boolean {
    return [
        'success',          // Payment completed
        'sandbox',          // Sandbox/test mode success
        'wait_compensation', // Successful, will be transferred in daily settlement
    ].includes(status);
}

/**
 * Check if the payment status indicates a failure or cancellation.
 */
export function isPaymentFailed(status: string): boolean {
    return [
        'failure',   // Payment failed
        'error',     // Error in payment data
        'reversed',  // Payment was refunded
    ].includes(status);
}
