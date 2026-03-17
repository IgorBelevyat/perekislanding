import { createHash } from 'crypto';
import { env } from '../../config/env';
import type { LiqPayFormData, LiqPayPaymentParams } from './types';

/**
 * Create base64-encoded data string for LiqPay.
 */
function encodeData(params: Record<string, unknown>): string {
    return Buffer.from(JSON.stringify(params)).toString('base64');
}

/**
 * Create LiqPay signature: base64(sha1(private_key + data + private_key))
 */
function createSignature(data: string): string {
    const privateKey = env.LIQPAY_PRIVATE_KEY ?? '';
    const signString = privateKey + data + privateKey;
    return createHash('sha1').update(signString).digest('base64');
}

/**
 * Generate data + signature for a payment form/redirect.
 */
export function createPaymentFormData(params: LiqPayPaymentParams): LiqPayFormData {
    const publicKey = env.LIQPAY_PUBLIC_KEY ?? '';

    const paymentParams = {
        public_key: publicKey,
        version: 3,
        action: 'pay',
        amount: params.amount,
        currency: params.currency,
        description: params.description,
        order_id: params.orderId,
        result_url: params.resultUrl,
        server_url: params.serverUrl, // callback
    };

    const data = encodeData(paymentParams);
    const signature = createSignature(data);

    return { data, signature };
}

/**
 * Generate the full checkout URL for redirect-based flow.
 */
export function getCheckoutUrl(formData: LiqPayFormData): string {
    return `https://www.liqpay.ua/api/3/checkout?data=${encodeURIComponent(formData.data)}&signature=${encodeURIComponent(formData.signature)}`;
}
