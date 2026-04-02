/* eslint-disable @typescript-eslint/no-explicit-any */

/** Raw MoySklad product attribute */
export interface MsAttribute {
    meta: { href: string; type: string };
    id: string;
    name: string;
    type: string;
    value: any; // string | boolean | number | { name: string; ... }
}

/** Raw MoySklad sale price entry */
export interface MsSalePrice {
    value: number; // price in kopecks (×100)
    currency: { meta: { href: string } };
    priceType: {
        meta: { href: string };
        id: string;
        name: string;
    };
}

/** Raw MoySklad product response */
export interface MsProduct {
    meta: { href: string; type: string };
    id: string;
    name: string;
    description?: string;
    code?: string;
    externalCode?: string;
    article?: string;
    archived: boolean;
    attributes?: MsAttribute[];
    salePrices?: MsSalePrice[];
    images?: { meta: { href: string; size: number } };
}

/** Raw MoySklad image entry */
export interface MsImage {
    meta: { href: string; downloadHref: string };
    filename: string;
    miniature?: { href: string };
    tiny?: { href: string };
}

/** Normalized product data for internal use */
export interface MsProductData {
    moyskladId: string;
    crmOfferId: string;         // mapped CRM code (e.g. "337674164")
    name: string;               // from "Наименование укр." attribute
    imageUrl: string | null;    // miniature URL (only for peroxide)
    prices: Record<string, number>; // CRM price code → price in UAH
    availability: string;       // raw: "+", "-", "&", "@", digit, ""
    inStock: boolean;           // derived from availability
    stockQty: number | null;    // numeric stock from report (fallback)
}
