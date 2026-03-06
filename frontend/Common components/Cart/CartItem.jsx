import { useCart } from '../../Stores/CartContext';

function CartItem({ item }) {
    const { updateQuantity, removeFromCart } = useCart();

    return (
        <div className="cart-item">
            <div className="cart-item__info">
                <p className="cart-item__name">{item.name}</p>
                <p className="cart-item__price">{item.price} грн × {item.quantity}</p>
            </div>
            <div className="cart-item__controls">
                <button className="cart-item__qty-btn" onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                <span className="cart-item__qty">{item.quantity}</span>
                <button className="cart-item__qty-btn" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                <button className="cart-item__remove" onClick={() => removeFromCart(item.id)} aria-label="Видалити">✕</button>
            </div>
        </div>
    );
}

export default CartItem;
