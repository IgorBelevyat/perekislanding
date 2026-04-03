import { useCart } from '../../Stores/CartContext';

function CartHistory() {
    const { orderHistory, reorder } = useCart();

    const formatDate = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('uk-UA', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    // Calculate benefit (savings) from server-side items
    const calcBenefit = (items) => {
        return (items || []).reduce((sum, item) => {
            const unitPrice = item.unitPrice ?? item.price ?? 0;
            const basePrice = item.basePrice ?? unitPrice;
            const qty = item.qty ?? item.quantity ?? 0;
            if (item.isGift) return sum; // gift items
            return sum + (basePrice - unitPrice) * qty;
        }, 0);
    };

    // Group order items by bundleId
    const groupOrderItems = (items) => {
        const bundles = new Map();
        const loose = [];

        for (const item of (items || [])) {
            if (item.bundleId) {
                const fallbackTitles = {
                    'optimal': 'Оптимальний вибір',
                    'pro': 'PRO запас',
                    'nasezon': 'На сезон',
                    'minimal': 'Мінімальний пакет'
                };
                if (!bundles.has(item.bundleId)) {
                    bundles.set(item.bundleId, {
                        items: [],
                        title: item.bundleTitle || fallbackTitles[item.bundleId] || item.bundleId,
                        type: item.bundleType || null,
                    });
                }
                bundles.get(item.bundleId).items.push(item);
            } else {
                loose.push(item);
            }
        }

        return { bundles, loose };
    };

    const renderItem = (item, i) => {
        const qty = item.qty ?? item.quantity ?? 1;
        const price = item.unitPrice ?? item.price ?? 0;
        const lineTotal = price * qty;
        return (
            <p key={i} className="cart-history__item">
                {item.name} × {qty} — {lineTotal} {item.isGift ? '(у подарунок)' : 'грн'}
            </p>
        );
    };

    return (
        <div className="cart-history">
            {orderHistory.map(order => {
                const benefit = calcBenefit(order.items);
                const { bundles, loose } = groupOrderItems(order.items);

                return (
                    <div key={order.id} className="cart-history__order">
                        <p className="cart-history__date">
                            Замовлення №{order.orderNumber || '—'} від {formatDate(order.date)}
                        </p>

                        {/* Grouped bundle items */}
                        {[...bundles.entries()].map(([bundleId, bundle]) => (
                            <div key={bundleId} className="cart-history__bundle">
                                <p className="cart-history__bundle-title">
                                    {bundle.title}
                                </p>
                                {bundle.items.map((item, i) => renderItem(item, `${bundleId}-${i}`))}
                            </div>
                        ))}

                        {/* Loose items */}
                        {loose.map((item, i) => renderItem(item, `loose-${i}`))}

                        <div className="cart-history__summary-row">
                            <p className="cart-history__total">Разом: {order.total} грн</p>
                            {benefit > 0 && (
                                <span className="cart-history__benefit-tag">
                                    Вигода: {benefit} ₴
                                </span>
                            )}
                        </div>
                        <button className="cart-history__reorder" onClick={() => reorder(order)}>
                            Замовити знову
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

export default CartHistory;
