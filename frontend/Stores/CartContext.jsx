import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../Api/api';
import PriceAlertModal from '../Common components/Cart/PriceAlertModal';

const CartContext = createContext();

const STORAGE_KEY = 'perekis_cart';
const HISTORY_KEY = 'perekis_order_history';

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
    const [orderHistory, setOrderHistory] = useState(() => loadFromStorage(HISTORY_KEY, []));
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Checkout states
    const [checkoutStep, setCheckoutStep] = useState('cart'); // 'cart' | 'checkout' | 'processing' | 'success' | 'failed'
    const [quoteId, setQuoteId] = useState(null);
    const [orderResult, setOrderResult] = useState(null);
    const [priceAlertMessage, setPriceAlertMessage] = useState(null);

    // Persist cart
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }, [items]);

    // Persist history
    useEffect(() => {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(orderHistory));
    }, [orderHistory]);

    const addToCart = (product, quantity = 1) => {
        setItems(prev => {
            const existing = prev.find(i => i.id === product.id);
            if (existing) {
                const priceHasChanged = existing.price !== product.price;
                return prev.map(i => {
                    if (i.id === product.id) {
                        return {
                            ...i,
                            quantity: i.quantity + quantity,
                            price: product.price,
                            ...(priceHasChanged && {
                                priceChanged: true,
                                oldPrice: i.oldPrice || i.price
                            })
                        };
                    }
                    return i;
                });
            }
            return [...prev, { ...product, quantity }];
        });
        setIsCartOpen(true); // Automatically open cart when adding items
    };

    const updateQuantity = (id, quantity) => {
        if (quantity <= 0) {
            removeFromCart(id);
            return;
        }
        setItems(prev => prev.map(i => i.id === id ? { ...i, quantity } : i));
    };

    const removeFromCart = (id) => {
        setItems(prev => prev.filter(i => i.id !== id));
    };

    const clearCart = () => setItems([]);

    const getTotal = () => {
        return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    };

    // Prepare a fresh quote from the current cart right before opening checkout
    const startCheckout = async () => {
        if (items.length === 0) return;
        setCheckoutStep('processing'); // Show loading state in modal
        try {
            const customItems = items.map(i => ({
                offerId: i.id,
                qty: i.quantity
            }));
            const res = await api.getQuote({ customItems });

            // Check for price drift
            let pricesDrifted = false;
            setItems(prev => {
                const updated = prev.map(cartItem => {
                    const serverItem = res.items?.find(si => si.offerId === cartItem.id);
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
        } catch (error) {
            console.error('Failed to start checkout:', error);
            setCheckoutStep('cart');
            setPriceAlertMessage('Не вдалося розпочати оформлення замовлення. Сервіс тимчасово недоступний. Будь ласка, спробуйте ще раз.');
        }
    };

    // Called when the checkout form is successfully submitted
    const completeOrder = (resultData) => {
        const order = {
            id: resultData.orderId || Date.now(),
            orderNumber: resultData.orderNumber || resultData.orderId || Date.now(),
            date: new Date().toISOString(),
            items: [...items],
            total: getTotal(),
            status: resultData.status || 'success'
        };
        setOrderHistory(prev => [order, ...prev]);
        setOrderResult(resultData);
        setCheckoutStep(resultData.status === 'failed' ? 'failed' : 'success');
        clearCart();
    };

    const resetCheckout = () => {
        setCheckoutStep('cart');
        setQuoteId(null);
        setOrderResult(null);
        setIsCartOpen(false);
    };

    const reorder = async (order) => {
        try {
            const customItems = order.items.map(i => ({
                offerId: i.id,
                qty: i.quantity
            }));
            const res = await api.getQuote({ customItems });

            let pricesDrifted = false;
            const updatedItems = order.items.map(oldItem => {
                const serverItem = res.items?.find(si => si.offerId === oldItem.id);
                if (serverItem && serverItem.unitPrice !== oldItem.price) {
                    pricesDrifted = true;
                    return { ...oldItem, price: serverItem.unitPrice, priceChanged: true };
                }
                return oldItem;
            });

            updatedItems.forEach(item => addToCart(item, item.quantity));

            if (pricesDrifted) {
                setPriceAlertMessage('Ціни на деякі товари відрізняються від вашого попереднього замовлення. Вони були додані до кошика з актуальними цінами.');
            }
        } catch (error) {
            console.error('Failed to validate reorder prices:', error);
            order.items.forEach(item => addToCart(item, item.quantity));
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
            clearCart,
            getTotal,
            reorder,
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
