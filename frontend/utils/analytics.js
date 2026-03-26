// Require VITE_GA4_MEASUREMENT_ID in the frontend .env file
export const GTAG_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID;

// Dynamically inject the GA script if the ID is present
if (typeof window !== 'undefined' && GTAG_ID) {
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GTAG_ID}`;
    script.async = true;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function() { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GTAG_ID, { send_page_view: true });
}

export const sendEvent = ({ action, category, label, value, ...rest }) => {
    if (typeof window !== 'undefined' && typeof window.gtag !== 'undefined') {
        window.gtag('event', action, {
            event_category: category,
            event_label: label,
            value: value,
            ...rest,
        });
    } else {
        // Fallback or dev logging
        // console.log('[GA4 Event MOCK]', action, { category, label, value, ...rest });
    }
};

export const trackAddToCart = (item, quantity) => {
    sendEvent({
        action: 'add_to_cart',
        currency: 'UAH',
        value: item.price * quantity,
        items: [{
            item_id: item.id,
            item_name: item.name,
            price: item.price,
            quantity: quantity,
            item_category: item.isBundleItem ? 'Bundle' : 'Product'
        }]
    });
};

export const trackRemoveFromCart = (item) => {
    sendEvent({
        action: 'remove_from_cart',
        currency: 'UAH',
        value: item.price * item.quantity,
        items: [{
            item_id: item.id,
            item_name: item.name,
            price: item.price,
            quantity: item.quantity,
            item_category: item.isBundleItem ? 'Bundle' : 'Product'
        }]
    });
};

export const trackCalculatorUsed = (volume, canisters) => {
    sendEvent({
        action: 'calculator_used',
        category: 'engagement',
        label: 'Calculator Result',
        value: canisters,
        volume_m3: volume,
        recommended_canisters: canisters
    });
};

export const trackContactClick = (type) => { // 'telegram' or 'phone'
    sendEvent({
        action: `click_${type}`,
        category: 'engagement',
        label: type
    });
};
