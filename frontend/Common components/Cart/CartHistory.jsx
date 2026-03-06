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

    return (
        <div className="cart-history">
            {orderHistory.map(order => (
                <div key={order.id} className="cart-history__order">
                    <p className="cart-history__date">{formatDate(order.date)}</p>
                    {order.items.map((item, i) => (
                        <p key={i} className="cart-history__item">
                            {item.name} × {item.quantity} — {item.price * item.quantity} грн
                        </p>
                    ))}
                    <p className="cart-history__total">Разом: {order.total} грн</p>
                    <button className="cart-history__reorder" onClick={() => reorder(order)}>
                        Замовити знову
                    </button>
                </div>
            ))}
        </div>
    );
}

export default CartHistory;
