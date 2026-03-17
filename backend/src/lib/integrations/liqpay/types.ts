export interface LiqPayPaymentParams {
    orderId: string;
    amount: number;
    currency: string;
    description: string;
    resultUrl?: string;
    serverUrl: string; // callback URL
}

export interface LiqPayFormData {
    data: string;
    signature: string;
}

export interface LiqPayCallbackData {
    action: string;
    status: string;
    order_id: string;
    amount: number;
    currency: string;
    transaction_id: number;
    payment_id: number;
    sender_phone?: string;
    err_code?: string;
    err_description?: string;
}
