// ─── RetailCRM Types ───────────────────────────────────────

export interface RetailCrmOffer {
    id: number;
    externalId: string;
    xmlId?: string;
    name: string;
    price: number;
    prices?: { priceType: string; price: number }[];
    currency: string;
    quantity?: number;
    unit?: string;
    images?: string[];
}

export interface RetailCrmProduct {
    id: number;
    name: string;
    imageUrl?: string;
    offers: RetailCrmOffer[];
}

export interface RetailCrmOrderItem {
    offer: { externalId: string };
    productName: string;
    quantity: number;
    initialPrice: number;
}

export interface RetailCrmCustomer {
    firstName: string;
    lastName?: string;
    phone: string;
    email?: string;
}

export interface RetailCrmCreateOrderPayload {
    site?: string;
    order: {
        externalId: string;
        number?: string;
        customer?: {
            externalId: string;
        };
        firstName: string;
        lastName?: string;
        phone: string;
        email?: string;
        items: RetailCrmOrderItem[];
        delivery?: {
            code: string;
            address?: { 
                text?: string;
                city?: string;
                street?: string;
                building?: string;
                flat?: string;
                block?: string;
            };
            data?: {
                receiverCity?: string;
                receiverCityRef?: string;
                receiverWarehouseTypeRef?: string;
                [key: string]: unknown;
            };
        };
        payments?: {
            type: string;
            amount?: number;
            status?: string;
        }[];
        customerComment?: string;
    };
}

export interface RetailCrmCreateOrderResponse {
    success: boolean;
    id: number;
    order: {
        id: number;
        externalId: string;
        number: string;
    };
}
