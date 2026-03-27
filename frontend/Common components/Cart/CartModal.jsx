import { useCart } from '../../Stores/CartContext';
import CartItem from './CartItem';
import CartHistory from './CartHistory';
import { useState, useEffect } from 'react';
import './CartModal.css';

function CartModal() {
    const { items, isCartOpen, setIsCartOpen, getTotal, getBenefit, startCheckout, checkoutStep, orderHistory } = useCart();
    const [showHistory, setShowHistory] = useState(false);

    // Body scroll lock
    useEffect(() => {
        const isVisible = isCartOpen && (checkoutStep === 'cart' || checkoutStep === 'processing');
        if (isVisible) {
            document.body.style.overflow = 'hidden';
            // Also add a class to html to prevent Safari bounce
            document.documentElement.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        };
    }, [isCartOpen, checkoutStep]);

    // Hide standard cart if we are in checkout flow
    if (!isCartOpen || (checkoutStep !== 'cart' && checkoutStep !== 'processing')) return null;

    return (
        <div className="cart-overlay" onClick={() => setIsCartOpen(false)}>
            <div className="cart-modal" onClick={e => e.stopPropagation()}>
                <div className="cart-modal__header">
                    <h3 className="cart-modal__title">Кошик</h3>
                    <button className="cart-modal__close" onClick={() => setIsCartOpen(false)} aria-label="Закрити">
                        ✕
                    </button>
                </div>

                {items.length === 0 ? (
                    <div className="cart-modal__empty">
                        <p>Кошик порожній</p>
                        <span>Додайте товари через калькулятор або сторінку продукту</span>
                    </div>
                ) : (
                    <>
                        <div className="cart-modal__items">
                            {items.map(item => (
                                <CartItem key={item.cartItemId} item={item} />
                            ))}
                        </div>

                        <div className="cart-modal__total">
                            <span>Разом:</span>
                            <strong>{getTotal()} грн</strong>
                        </div>

                        {getBenefit() > 0 && (
                            <div className="cart-modal__benefit">
                                <span>Ваша вигода:</span>
                                <strong>{getBenefit()} грн</strong>
                            </div>
                        )}

                        <button
                            className="cart-modal__checkout"
                            onClick={() => startCheckout()}
                            disabled={checkoutStep === 'processing'}
                        >
                            {checkoutStep === 'processing' ? 'Підготовка замовлення...' : 'Оформити замовлення'}
                        </button>

                        <p className="cart-modal__hint">
                            Оплата при отриманні · Доставка Новою Поштою
                        </p>

                        <button
                            className="cart-modal__continue"
                            onClick={() => setIsCartOpen(false)}
                        >
                            Продовжити покупки
                        </button>
                    </>
                )}

                {orderHistory.length > 0 && (
                    <div className="cart-modal__history-toggle">
                        <button
                            className="cart-modal__history-btn"
                            onClick={() => setShowHistory(!showHistory)}
                        >
                            {showHistory ? 'Приховати' : 'Попередні покупки'} ({orderHistory.length})
                        </button>
                    </div>
                )}

                {showHistory && orderHistory.length > 0 && (
                    <CartHistory />
                )}
            </div>
        </div>
    );
}

export default CartModal;
