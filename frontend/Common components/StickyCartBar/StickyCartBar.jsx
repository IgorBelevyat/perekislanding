import { useEffect, useState } from 'react';
import { useCart } from '../../Stores/CartContext';
import { api } from '../../Api/api';
import './StickyCartBar.css';

function StickyCartBar() {
    const [visible, setVisible] = useState(false);
    const [price, setPrice] = useState(649); // default fallback
    const [name, setName] = useState('Перекис водню 50%, 5 кг'); // default fallback
    const { items, getTotal, setIsCartOpen } = useCart();

    useEffect(() => {
        let isMounted = true;
        api.getProducts().then(data => {
            if (isMounted && data.products) {
                const mainProduct = data.products.find(p => p.isMainProduct);
                if (mainProduct) {
                    setPrice(mainProduct.price);
                    setName(mainProduct.name);
                }
            }
        }).catch(err => console.error('Failed to fetch price for sticky bar:', err));

        const handleScroll = () => {
            const bundlesEl = document.getElementById('bundles');
            if (bundlesEl) {
                setVisible(bundlesEl.getBoundingClientRect().bottom < 100);
            } else {
                setVisible(window.scrollY > 1200);
            }
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
                    <span className="sticky-cart__product">У кошику {items.length} товар(ів)</span>
                    <div className="sticky-cart__action-row">
                        <span className="sticky-cart__price">{getTotal()} грн</span>
                        <button
                            className="sticky-cart__btn"
                            onClick={(e) => { e.stopPropagation(); setIsCartOpen(true); }}
                        >
                            Оформити
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="sticky-cart">
            <div className="sticky-cart__inner">
                <span className="sticky-cart__product">{name}</span>
                <div className="sticky-cart__action-row">
                    <span className="sticky-cart__price">від {price} грн</span>
                    <button
                        className="sticky-cart__btn"
                        onClick={() => document.getElementById('product')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                        До товару
                    </button>
                </div>
            </div>
        </div>
    );
}

export default StickyCartBar;
