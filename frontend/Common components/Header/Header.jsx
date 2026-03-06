import { useState } from 'react';
import { useCart } from '../../Stores/CartContext';
import './Header.css';

function Header() {
    const { items, setIsCartOpen } = useCart();
    const [menuOpen, setMenuOpen] = useState(false);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <header className="header">
            <div className="header__inner">
                <a href="https://hlorka.ua" className="header__logo" target="_blank" rel="noopener noreferrer">
                    <span className="header__logo-text">H</span>
                    <span className="header__logo-accent">LORKA</span>
                </a>

                <nav className={`header__nav ${menuOpen ? 'header__nav--open' : ''}`}>
                    <a href="#calculator" className="header__link" onClick={() => setMenuOpen(false)}>Калькулятор</a>
                    <a href="#product" className="header__link" onClick={() => setMenuOpen(false)}>Купити</a>
                    <a href="#faq" className="header__link" onClick={() => setMenuOpen(false)}>FAQ</a>
                    <a href="tel:+380883354267" className="header__phone">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                        </svg>
                        0 883 354 267
                    </a>
                </nav>

                <div className="header__actions">
                    <button className="header__cart-btn" onClick={() => setIsCartOpen(true)} aria-label="Корзина">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                            <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                        </svg>
                        {totalItems > 0 && <span className="header__cart-badge">{totalItems}</span>}
                    </button>

                    <button
                        className="header__burger"
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Меню"
                    >
                        <span className={`header__burger-line ${menuOpen ? 'header__burger-line--open' : ''}`}></span>
                    </button>
                </div>
            </div>
        </header>
    );
}

export default Header;
