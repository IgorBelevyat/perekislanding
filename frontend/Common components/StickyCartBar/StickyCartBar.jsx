import { useEffect, useState } from 'react';
import './StickyCartBar.css';

function StickyCartBar() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setVisible(window.scrollY > 600);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (!visible) return null;

    return (
        <div className="sticky-cart">
            <div className="sticky-cart__inner">
                <div className="sticky-cart__info">
                    <span className="sticky-cart__product">Перекис 50%, 5 кг</span>
                    <span className="sticky-cart__price">340 грн</span>
                </div>
                <button
                    className="sticky-cart__btn"
                    onClick={() => document.getElementById('product')?.scrollIntoView({ behavior: 'smooth' })}
                >
                    Купити
                </button>
            </div>
        </div>
    );
}

export default StickyCartBar;
