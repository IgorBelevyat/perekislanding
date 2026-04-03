import { useCart } from '../../Stores/CartContext';
import CartItem from './CartItem';
import CartHistory from './CartHistory';
import { useState, useEffect } from 'react';
import './CartModal.css';

/**
 * Group cart items into bundles and loose items.
 * Returns: { bundles: Map<bundleId, { items, title, type, isPopular }>, loose: item[] }
 */
function groupItems(items) {
    const bundles = new Map();
    const loose = [];

    for (const item of items) {
        if (item.bundleId) {
            if (!bundles.has(item.bundleId)) {
                bundles.set(item.bundleId, {
                    items: [],
                    title: item.bundleTitle || item.bundleId,
                    type: item.bundleType || 'minimal',
                    isPopular: item.isPopular || false,
                });
            }
            bundles.get(item.bundleId).items.push(item);
        } else {
            loose.push(item);
        }
    }

    return { bundles, loose };
}

// Removed to simplify layout, we calculate multiplier M below

// Color mapping for bundle borders (matching BundlesBlock button/title colors)
const BUNDLE_COLORS = {
    minimal: '#0096B8',  // На сезон — бірюзовий (primary)
    optimal: '#FF7A00',  // Оптимальний вибір — помаранчевий (CTA)
    maximum: '#003B5C',  // PRO запас — темно-синій (title color)
};

function CartModal() {
    const { items, isCartOpen, setIsCartOpen, getTotal, getBenefit, startCheckout, checkoutStep, orderHistory, removeBundle } = useCart();
    const [showHistory, setShowHistory] = useState(false);

    // Body scroll lock
    useEffect(() => {
        const isVisible = isCartOpen && (checkoutStep === 'cart' || checkoutStep === 'processing');
        if (isVisible) {
            document.body.style.overflow = 'hidden';
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

    const { bundles, loose } = groupItems(items);

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
                            {/* Render bundle groups */}
                            {[...bundles.entries()].map(([bundleId, bundle]) => {
                                // Calculate bundle multiplier based on peroxide minQty
                                const peroxideItem = bundle.items.find(i => i.name?.includes('Перекис'));
                                const M = (peroxideItem && peroxideItem.minQty) 
                                    ? Math.floor(peroxideItem.quantity / peroxideItem.minQty) 
                                    : 1;

                                const displayTitle = M > 1
                                    ? `${M} × ${bundle.title}`
                                    : bundle.title;

                                return (
                                    <div
                                        key={bundleId}
                                        className="cart-bundle"
                                    >
                                        <div className="cart-bundle__header">
                                            <div className="cart-bundle__header-left">
                                                <span className="cart-bundle__title">
                                                    {displayTitle}
                                                </span>
                                                {bundle.isPopular && (
                                                    <span className="cart-bundle__tag">
                                                        Найпопулярніший
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                className="cart-bundle__remove"
                                                onClick={() => removeBundle(bundleId)}
                                                aria-label="Видалити набір"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                        <div className="cart-bundle__items">
                                            {bundle.items.map(item => {
                                                // Peroxide in bundle → fully locked (no +/-, no active ✕)
                                                const isPeroxide = item.name?.includes('Перекис');
                                                // Gift → +/- limited to M, active ✕
                                                const isGift = item.isGift;

                                                return (
                                                    <CartItem
                                                        key={item.cartItemId}
                                                        item={item}
                                                        locked={isPeroxide && !isGift}
                                                        giftOnly={isGift}
                                                        maxQty={isGift ? M : undefined}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Render standalone items (not in any bundle) */}
                            {loose.map(item => (
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
