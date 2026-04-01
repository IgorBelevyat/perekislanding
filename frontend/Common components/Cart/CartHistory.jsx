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
            if (unitPrice === 0) return sum; // gift items
            return sum + (basePrice - unitPrice) * qty;
        }, 0);
    };

    return (
        <div className="cart-history">
            {orderHistory.map(order => {
                const benefit = calcBenefit(order.items);
                return (
                    <div key={order.id} className="cart-history__order">
                        <p className="cart-history__date">
                            Замовлення №{order.orderNumber || '—'} від {formatDate(order.date)}
                        </p>
                        {(order.items || []).map((item, i) => {
                            const qty = item.qty ?? item.quantity ?? 1;
                            const price = item.unitPrice ?? item.price ?? 0;
                            const lineTotal = price * qty;
                            return (
                                <p key={i} className="cart-history__item">
                                    {item.name} × {qty} — {lineTotal} {price === 0 ? '(У подарунок)' : 'грн'}
                                </p>
                            );
                        })}
                        <p className="cart-history__total">Разом: {order.total} грн</p>
                        {benefit > 0 && (
                            <p className="cart-history__total" style={{ color: '#10B981', marginTop: '0', border: 'none' }}>
                                Ваша вигода: {benefit} грн
                            </p>
                        )}
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
