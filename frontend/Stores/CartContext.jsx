import { createContext, useContext, useState, useEffect } from 'react';

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
                return prev.map(i =>
                    i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
                );
            }
            return [...prev, { ...product, quantity }];
        });
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

    const placeOrder = () => {
        if (items.length === 0) return;
        const order = {
            id: Date.now(),
            date: new Date().toISOString(),
            items: [...items],
            total: getTotal(),
        };
        setOrderHistory(prev => [order, ...prev]);
        clearCart();
    };

    const reorder = (order) => {
        order.items.forEach(item => addToCart(item, item.quantity));
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
            placeOrder,
            reorder,
        }}>
            {children}
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
