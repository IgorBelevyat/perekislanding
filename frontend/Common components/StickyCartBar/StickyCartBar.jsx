import { useEffect, useState } from 'react';
import { useCart } from '../../Stores/CartContext';
import { api } from '../../Api/api';
import './StickyCartBar.css';

function StickyCartBar() {
    const [visible, setVisible] = useState(false);
    const [price, setPrice] = useState(340); // default fallback
    const [name, setName] = useState('Перекис водню 50%, 5 кг'); // default fallback
    const { items, getTotal, setIsCartOpen } = useCart();

    useEffect(() => {
        let isMounted = true;
        api.getProducts().then(data => {
            if (isMounted && data.products) {
                const p5l = data.products.find(p => p.id === 'peroxide-5l');
                if (p5l) {
                    setPrice(p5l.price);
                    setName(p5l.name);
                }
            }
        }).catch(err => console.error('Failed to fetch price for sticky bar:', err));

        const handleScroll = () => {
            setVisible(window.scrollY > 600);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            isMounted = false;
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    if (!visible) return null;

    if (items.length > 0) {
        return (
            <div className="sticky-cart" onClick={() => setIsCartOpen(true)}>
                <div className="sticky-cart__inner">
                    <div className="sticky-cart__info">
                        <span className="sticky-cart__product">У кошику {items.length} товар(ів)</span>
                        <span className="sticky-cart__price">{getTotal()} грн</span>
                    </div>
                    <button
                        className="sticky-cart__btn"
                        onClick={(e) => { e.stopPropagation(); setIsCartOpen(true); }}
                    >
                        Оформити
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="sticky-cart">
            <div className="sticky-cart__inner">
                <div className="sticky-cart__info">
                    <span className="sticky-cart__product">{name}</span>
                    <span className="sticky-cart__price">від {price} грн</span>
                </div>
                <button
                    className="sticky-cart__btn"
                    onClick={() => document.getElementById('product')?.scrollIntoView({ behavior: 'smooth' })}
                >
                    Обрати
                </button>
            </div>
        </div>
    );
}

export default StickyCartBar;
