import { useCart } from '../../Stores/CartContext';
import CartItem from './CartItem';
import CartHistory from './CartHistory';
import { useState } from 'react';
import './CartModal.css';

function CartModal() {
    const { items, isCartOpen, setIsCartOpen, getTotal, placeOrder, orderHistory } = useCart();
    const [showHistory, setShowHistory] = useState(false);

    if (!isCartOpen) return null;

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
                                <CartItem key={item.id} item={item} />
                            ))}
                        </div>

                        <div className="cart-modal__total">
                            <span>Разом:</span>
                            <strong>{getTotal()} грн</strong>
                        </div>

                        <button className="cart-modal__checkout" onClick={() => { placeOrder(); }}>
                            Оформити замовлення
                        </button>

                        <p className="cart-modal__hint">
                            Оплата при отриманні · Доставка Новою Поштою
                        </p>
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
