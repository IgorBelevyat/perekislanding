import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../Api/api';
import PriceAlertModal from '../Common components/Cart/PriceAlertModal';
import { trackAddToCart, trackRemoveFromCart, trackBeginCheckout, trackPurchase } from '../utils/analytics';

const CartContext = createContext();

const STORAGE_KEY = 'perekis_cart';
const CUSTOMER_ID_KEY = 'hlorka_customer_id';

function loadFromStorage(key, fallback) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : fallback;
    } catch {
        return fallback;
    }
}

export function CartProvider({ children }) {
    const [items, setItems] = useState(() => loadFromStorage(STORAGE_KEY, []));
    const [orderHistory, setOrderHistory] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [activeBundleId, setActiveBundleId] = useState(null);

    // Checkout states
    const [checkoutStep, setCheckoutStep] = useState('cart'); // 'cart' | 'checkout' | 'processing' | 'success' | 'failed'
    const [quoteId, setQuoteId] = useState(null);
    const [orderResult, setOrderResult] = useState(null);
    const [priceAlertMessage, setPriceAlertMessage] = useState(null);

    // Persist cart
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }, [items]);

    // Fetch order history from server
    const fetchOrderHistory = useCallback(async () => {
        try {
            const customerId = localStorage.getItem(CUSTOMER_ID_KEY);
            if (!customerId) return;
            const data = await api.getOrderHistory(customerId);
            setOrderHistory(data.orders || []);
        } catch (err) {
            console.error('Failed to fetch order history:', err);
        }
    }, []);

    // Load order history on mount
    useEffect(() => {
        fetchOrderHistory();
    }, [fetchOrderHistory]);

    // Check URL for LiqPay redirect and verify actual payment status
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('orderId');
        const orderNumber = urlParams.get('orderNumber');
        if (!orderId) return;

        // Clean up URL immediately
        window.history.replaceState({}, document.title, window.location.pathname);

        // Show processing state while we check
        setCheckoutStep('processing');

        const checkPaymentStatus = async (retries = 0) => {
            try {
                const data = await api.getOrderStatus(orderId);

                if (data.paymentStatus === 'PAID') {
                    // Track purchase BEFORE clearing cart (items & getTotal need cart data)
                    trackPurchase(items, orderNumber || orderId, getTotal());
                    setOrderResult({ orderId, orderNumber: orderNumber || orderId, status: 'success' });
                    setCheckoutStep('success');
                    setItems([]); // Clear cart after successful payment
                    fetchOrderHistory(); // Refresh history from server
                } else if (data.paymentStatus === 'FAILED') {
                    setOrderResult({ orderId, orderNumber: orderNumber || orderId, status: 'failed' });
                    setCheckoutStep('failed');
                } else if (data.paymentStatus === 'PENDING' && retries < 5) {
                    // LiqPay callback may not have arrived yet — retry after short delay
                    setTimeout(() => checkPaymentStatus(retries + 1), 2000);
                } else {
                    // After retries, still PENDING = user likely cancelled on LiqPay
                    setOrderResult({ orderId, orderNumber: orderNumber || orderId, status: 'failed' });
                    setCheckoutStep('failed');
                }
            } catch (err) {
                console.error('Failed to check payment status:', err);
                // Fallback: show success (order was created, callback will process later)
                trackPurchase(items, orderNumber || orderId, getTotal());
                setOrderResult({ orderId, orderNumber: orderNumber || orderId, status: 'success' });
                setCheckoutStep('success');
                setItems([]);
                fetchOrderHistory();
            }
        };

        checkPaymentStatus();
    }, [fetchOrderHistory]);

    // On-load: validate prices for all items already in cart (including bundle items)
    useEffect(() => {
        if (items.length === 0) return;

        const validatePrices = async () => {
            try {
                const customItems = items.map(i => {
                    const payloadItem = {
                        offerId: i.id,
                        qty: i.quantity,
                        isBundleItem: i.isBundleItem,
                        isGift: !!i.isGift
                    };
                    if (i.bundleId) payloadItem.bundleId = i.bundleId;
                    return payloadItem;
                });

                const res = await api.getQuote({ customItems });

                let pricesDrifted = false;
                setItems(prev => {
                    const updated = prev.map(cartItem => {
                        const serverItem = res.items?.find(si =>
                            si.offerId === cartItem.id &&
                            Boolean(si.isBundleItem) === Boolean(cartItem.isBundleItem) &&
                            si.bundleId === cartItem.bundleId
                        );
                        if (serverItem && serverItem.unitPrice !== cartItem.price) {
                            pricesDrifted = true;
                            return {
                                ...cartItem,
                                price: serverItem.unitPrice,
                                basePrice: serverItem.basePrice,
                                priceChanged: true,
                                oldPrice: cartItem.price
                            };
                        }
                        // Clear stale priceChanged flag if price is now correct
                        if (cartItem.priceChanged && serverItem && serverItem.unitPrice === cartItem.price) {
                            const { priceChanged, oldPrice, ...rest } = cartItem;
                            return rest;
                        }
                        return cartItem;
                    });
                    return updated;
                });

                if (pricesDrifted) {
                    setPriceAlertMessage('Ціни на деякі товари у кошику змінилися. Суми оновлено до актуальних цін.');
                }
            } catch (err) {
                console.error('Failed to validate cart prices on load:', err);
            }
        };

        validatePrices();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only on mount

    const addToCart = (product, quantity = 1, options = {}) => {
        const bundleId = options.bundleId || null;
        const minQty = options.minQty || 1;
        const cartItemId = bundleId 
            ? `${product.id}-${bundleId}` 
            : `${product.id}-regular`;

        setItems(prev => {
            const existing = prev.find(i => i.cartItemId === cartItemId);
            if (existing) {
                const priceHasChanged = existing.price !== product.price;
                return prev.map(i => {
                    if (i.cartItemId === cartItemId) {
                        return {
                            ...i,
                            quantity: i.quantity + quantity,
                            price: product.price,
                            basePrice: product.basePrice,
                            ...(priceHasChanged && {
                                priceChanged: true,
                                oldPrice: i.oldPrice || i.price
                            })
                        };
                    }
                    return i;
                });
            }
            return [...prev, {
                ...product,
                quantity,
                cartItemId,
                isBundleItem: !!bundleId,
                bundleId,
                bundleTitle: options.bundleTitle || null,
                bundleType: options.bundleType || null,
                isPopular: options.isPopular || false,
                isGift: options.isGift || false,
                minQty,
            }];
        });
        trackAddToCart(product, quantity);
        setIsCartOpen(true); // Automatically open cart when adding items
    };

    const updateQuantity = (cartItemId, quantity) => {
        setItems(prev => {
            const item = prev.find(i => i.cartItemId === cartItemId);
            if (!item) return prev;

            if (item.minQty && quantity < item.minQty) {
                return prev; // strictly prevent going below bundle minimum
            }

            if (quantity <= 0) {
                trackRemoveFromCart(item);
                return prev.filter(i => i.cartItemId !== cartItemId);
            }

            return prev.map(i => i.cartItemId === cartItemId ? { ...i, quantity } : i);
        });
    };

    const removeFromCart = (cartItemId) => {
        setItems(prev => {
            const item = prev.find(i => i.cartItemId === cartItemId);
            if (item) trackRemoveFromCart(item);
            return prev.filter(i => i.cartItemId !== cartItemId);
        });
    };

    // Remove entire bundle (all items with same bundleId)
    const removeBundle = (bundleId) => {
        setItems(prev => {
            const bundleItems = prev.filter(i => i.bundleId === bundleId);
            bundleItems.forEach(item => trackRemoveFromCart(item));
            return prev.filter(i => i.bundleId !== bundleId);
        });
    };

    const clearCart = () => setItems([]);

    const getTotal = () => {
        return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    };

    const getBenefit = () => {
        return items.reduce((sum, item) => {
            // Skip gift items — they're bonuses, not savings
            if (item.isGift) return sum;
            const base = item.basePrice || item.price;
            return sum + ((base - item.price) * item.quantity);
        }, 0);
    };

    // Prepare a fresh quote from the current cart right before opening checkout
    const startCheckout = async () => {
        if (items.length === 0) return;
        setCheckoutStep('processing'); // Show loading state in modal
        try {
            const customItems = items.map(i => {
                const payloadItem = {
                    offerId: i.id,
                    qty: i.quantity,
                    isBundleItem: i.isBundleItem,
                    isGift: !!i.isGift
                };
                if (i.bundleId) payloadItem.bundleId = i.bundleId;
                return payloadItem;
            });
            const payload = { customItems };
            const res = await api.getQuote(payload);

            // Check for price drift
            let pricesDrifted = false;
            setItems(prev => {
                const updated = prev.map(cartItem => {
                    // Match the returned API quote item by context (isBundleItem flag) AND bundleId
                    const serverItem = res.items?.find(si => si.offerId === cartItem.id && Boolean(si.isBundleItem) === Boolean(cartItem.isBundleItem) && si.bundleId === cartItem.bundleId);
                    if (serverItem && serverItem.unitPrice !== cartItem.price) {
                        pricesDrifted = true;
                        return {
                            ...cartItem,
                            price: serverItem.unitPrice,
                            priceChanged: true,
                            oldPrice: cartItem.price
                        };
                    }
                    return cartItem;
                });
                return updated;
            });

            if (pricesDrifted) {
                setPriceAlertMessage('Ціни на деякі товари змінилися, поки вони були у кошику. Сума замовлення та самі товари були оновлені до актуальних цін з бази.');
            }

            setQuoteId(res.quoteId);
            setCheckoutStep('checkout');
            trackBeginCheckout(items, getTotal());
        } catch (error) {
            console.error('Failed to start checkout:', error);
            setCheckoutStep('cart');
            setPriceAlertMessage('Не вдалося розпочати оформлення замовлення. Сервіс тимчасово недоступний. Будь ласка, спробуйте ще раз.');
        }
    };

    // Called when the checkout form is successfully submitted
    const completeOrder = (resultData) => {
        setOrderResult(resultData);
        setCheckoutStep(resultData.status === 'failed' ? 'failed' : 'success');
        
        if (resultData.status !== 'failed') {
            trackPurchase(items, resultData.orderNumber || resultData.orderId, getTotal());
        }
        
        clearCart();
        // Refresh history from server (the order is now in the DB)
        fetchOrderHistory();
    };

    const resetCheckout = () => {
        setCheckoutStep('cart');
        setQuoteId(null);
        setOrderResult(null);
        setIsCartOpen(false);
    };

    const reorder = async (order) => {
        try {
            // Server-side items have: { offerId, name, qty, unitPrice, bundleId?, isBundleItem? }
            // Map them to quote request format
            const serverItems = order.items || [];
            const customItems = serverItems.map(i => {
                const payloadItem = {
                    offerId: i.offerId || i.id,
                    qty: i.qty || i.quantity,
                    isBundleItem: !!i.isBundleItem,
                    isGift: !!i.isGift
                };
                if (i.bundleId) payloadItem.bundleId = i.bundleId;
                return payloadItem;
            });
            const payload = { customItems };
            const res = await api.getQuote(payload);

            let pricesDrifted = false;
            const cartItems = serverItems.map(oldItem => {
                const oid = oldItem.offerId || oldItem.id;
                const oldPrice = oldItem.unitPrice ?? oldItem.price;
                const oldQty = oldItem.qty ?? oldItem.quantity;

                const serverItem = res.items?.find(si =>
                    si.offerId === oid &&
                    Boolean(si.isBundleItem) === Boolean(oldItem.isBundleItem) &&
                    si.bundleId === oldItem.bundleId
                );

                // Build cart-compatible item
                const cartItem = {
                    id: oid,
                    name: oldItem.name || oldItem.productName,
                    price: serverItem ? serverItem.unitPrice : oldPrice,
                    basePrice: serverItem?.basePrice || oldPrice,
                    quantity: oldQty,
                    isBundleItem: !!oldItem.isBundleItem,
                    bundleId: oldItem.bundleId || null,
                    bundleTitle: oldItem.bundleTitle || null,
                    bundleType: oldItem.bundleType || null,
                    isPopular: oldItem.isPopular || false,
                    isGift: !!oldItem.isGift || oldPrice === 1,
                };

                if (serverItem && serverItem.unitPrice !== oldPrice) {
                    pricesDrifted = true;
                    cartItem.priceChanged = true;
                }
                return cartItem;
            });

            const fallbackTitles = {
                'optimal': 'Оптимальний вибір',
                'pro': 'PRO запас',
                'nasezon': 'На сезон',
                'minimal': 'Мінімальний пакет'
            };

            cartItems.forEach(item => {
                let minQty = 1;
                if (item.name?.includes('Перекис')) {
                    if (item.bundleId === 'optimal') minQty = 2;
                    else if (item.bundleId === 'nasezon') minQty = 3;
                    else if (item.bundleId === 'pro') minQty = 6;
                }
                const resolvedTitle = item.bundleTitle || fallbackTitles[item.bundleId] || item.bundleId;

                addToCart(item, item.quantity, {
                    bundleId: item.bundleId,
                    bundleTitle: resolvedTitle,
                    bundleType: item.bundleType || item.bundleId,
                    isPopular: item.isPopular,
                    isGift: item.isGift,
                    minQty: minQty
                });
            });

            if (pricesDrifted) {
                setPriceAlertMessage('Ціни на деякі товари відрізняються від вашого попереднього замовлення. Вони були додані до кошика з актуальними цінами.');
            }
        } catch (error) {
            console.error('Failed to validate reorder prices:', error);
            // Fallback: add items directly with server-side field mapping
            const serverItems = order.items || [];
            serverItems.forEach(item => {
                const cartItem = {
                    id: item.offerId || item.id,
                    name: item.name || item.productName,
                    price: item.unitPrice ?? item.price,
                    quantity: item.qty ?? item.quantity,
                    isBundleItem: !!item.isBundleItem,
                    bundleId: item.bundleId || null,
                    bundleTitle: item.bundleTitle || null,
                    bundleType: item.bundleType || null,
                    isPopular: item.isPopular || false,
                    isGift: !!item.isGift || (item.unitPrice ?? item.price) === 1,
                };
                const fallbackTitles = {
                    'optimal': 'Оптимальний вибір',
                    'pro': 'PRO запас',
                    'nasezon': 'На сезон',
                    'minimal': 'Мінімальний пакет'
                };
                
                let minQty = 1;
                if (cartItem.name?.includes('Перекис')) {
                    if (cartItem.bundleId === 'optimal') minQty = 2;
                    else if (cartItem.bundleId === 'nasezon') minQty = 3;
                    else if (cartItem.bundleId === 'pro') minQty = 6;
                }
                const resolvedTitle = cartItem.bundleTitle || fallbackTitles[cartItem.bundleId] || cartItem.bundleId;

                addToCart(cartItem, cartItem.quantity, {
                    bundleId: cartItem.bundleId,
                    bundleTitle: resolvedTitle,
                    bundleType: cartItem.bundleType || cartItem.bundleId,
                    isPopular: cartItem.isPopular,
                    isGift: cartItem.isGift,
                    minQty: minQty
                });
            });
        }
        setIsCartOpen(true);
    };

    return (
        <CartContext.Provider value={{
            items,
            orderHistory,
            isCartOpen,
            setIsCartOpen,
            addToCart,
            updateQuantity,
            removeFromCart,
            removeBundle,
            clearCart,
            getTotal,
            getBenefit,
            reorder,
            activeBundleId,
            setActiveBundleId,
            // Checkout specific
            checkoutStep,
            setCheckoutStep,
            quoteId,
            orderResult,
            startCheckout,
            completeOrder,
            resetCheckout,
        }}>
            {children}
            <PriceAlertModal
                message={priceAlertMessage}
                onClose={() => setPriceAlertMessage(null)}
            />
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }
    return context;
}
