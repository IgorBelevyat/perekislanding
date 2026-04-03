import { useCart } from '../../Stores/CartContext';

function CartItem({ item, locked, giftOnly, maxQty }) {
    const { updateQuantity, removeFromCart } = useCart();

    // locked = bundle peroxide -> ALL controls disabled
    // giftOnly = bundle gift -> +/- active (1 to maxQty), ✕ active

    const disableMinus = locked || (item.minQty && item.quantity <= item.minQty) || (giftOnly && item.quantity <= 1);
    const disablePlus = locked || (maxQty && item.quantity >= maxQty) || (item.maxQty && item.quantity >= item.maxQty);
    
    // User explicitly requested: "додай хрестик до перекиси, але зроби його не активним"
    const disableRemove = locked;

    return (
        <div className={`cart-item${locked ? ' cart-item--locked' : ''}${giftOnly ? ' cart-item--gift' : ''}`}>
            <div className="cart-item__info">
                <p className="cart-item__name">{item.name}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <p className="cart-item__price">
                        {item.isGift ? `${item.price} грн × ${item.quantity} (у подарунок)` : `${item.price} грн × ${item.quantity}`}
                    </p>
                    {item.priceChanged && (
                        <span style={{ fontSize: '0.75rem', color: '#d32f2f', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 9V14M12 17.5V18M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" stroke="#d32f2f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Увага! Ціну даного товару було змінено!
                        </span>
                    )}
                </div>
            </div>
            <div className="cart-item__controls">
                <button 
                    className="cart-item__qty-btn" 
                    onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                    disabled={disableMinus}
                >−</button>
                <span className="cart-item__qty">{item.quantity}</span>
                <button 
                    className="cart-item__qty-btn" 
                    onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                    disabled={disablePlus}
                >+</button>

                <button 
                    className="cart-item__remove" 
                    onClick={() => removeFromCart(item.cartItemId)} 
                    disabled={disableRemove}
                    aria-label="Видалити"
                >✕</button>
            </div>
        </div>
    );
}

export default CartItem;
