// Require VITE_GTM_ID in the frontend .env file
export const GTM_ID = import.meta.env.VITE_GTM_ID;

// Ensure dataLayer is available
window.dataLayer = window.dataLayer || [];

export const sendEvent = (eventData) => {
    if (typeof window !== 'undefined' && window.dataLayer) {
        window.dataLayer.push({
            page_location: window.location.href,
            page_referrer: document.referrer || '',
            page_title: document.title,
            ...eventData
        });
    } else {
        // Fallback or dev logging
        // console.log('[GTM Event MOCK]', eventData);
    }
};

export const trackAddToCart = (item, quantity) => {
    sendEvent({
        event: 'add_to_cart',
        ecommerce: {
            currency: 'UAH',
            value: item.price * quantity,
            items: [{
                item_id: item.id,
                item_name: item.name,
                price: item.price,
                quantity: quantity,
                item_category: item.isBundleItem ? 'Bundle' : 'Product'
            }]
        }
    });
};

export const trackRemoveFromCart = (item) => {
    sendEvent({
        event: 'remove_from_cart',
        ecommerce: {
            currency: 'UAH',
            value: item.price * item.quantity,
            items: [{
                item_id: item.id,
                item_name: item.name,
                price: item.price,
                quantity: item.quantity,
                item_category: item.isBundleItem ? 'Bundle' : 'Product'
            }]
        }
    });
};

export const trackBeginCheckout = (items, totalValue) => {
    sendEvent({
        event: 'begin_checkout',
        ecommerce: {
            currency: 'UAH',
            value: totalValue,
            items: items.map(item => ({
                item_id: item.id,
                item_name: item.name,
                price: item.price,
                quantity: item.quantity,
                item_category: item.isBundleItem ? 'Bundle' : 'Product'
            }))
        }
    });
};

export const trackPurchase = (items, transaction_id, totalValue) => {
    sendEvent({
        event: 'purchase',
        ecommerce: {
            transaction_id: transaction_id,
            value: totalValue,
            currency: 'UAH',
            shipping: 0,
            tax: 0,
            items: items.map(item => ({
                item_id: item.id,
                item_name: item.name,
                price: item.price,
                quantity: item.quantity,
                item_category: item.isBundleItem ? 'Bundle' : 'Product'
            }))
        }
    });
};

export const trackCalculatorUsed = (volume, canisters) => {
    sendEvent({
        event: 'calculator_used',
        volume_m3: volume,
        recommended_canisters: canisters
    });
};

export const trackContactClick = (type) => { // 'telegram' or 'phone'
    sendEvent({
        event: `click_${type}`
    });
};
