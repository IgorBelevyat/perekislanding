import { useState, useEffect } from 'react';
import { useCart } from '../../Stores/CartContext';
import logoImg from '../../Src/assets/images/logo.png';
import './Header.css';

function Header() {
    const { items, setIsCartOpen } = useCart();
    const [menuOpen, setMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [fadeProgress, setFadeProgress] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;

            if (window.innerWidth <= 768) {
                const vh = window.innerHeight;
                const startFade = vh * 0.8;
                const endFade = vh;

                if (scrollY <= startFade) {
                    setFadeProgress(0);
                    setIsScrolled(false);
                } else if (scrollY >= endFade) {
                    setFadeProgress(1);
                    setIsScrolled(true);
                } else {
                    const progress = (scrollY - startFade) / (endFade - startFade);
                    setFadeProgress(progress);
                    setIsScrolled(progress > 0.5);
                }
            } else {
                setIsScrolled(scrollY > 20);
                setFadeProgress(scrollY > 20 ? 1 : 0);
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // init
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <header
            className={`header ${!isScrolled && !menuOpen ? 'header--transparent' : ''}`}
            style={{ '--fade-progress': menuOpen ? 1 : fadeProgress }}
        >
            <div className="header__inner">
                <a href="https://hlorka.ua" className="header__logo" target="_blank" rel="noopener noreferrer">
                    <img src={logoImg} alt="Hlorka Logo" className="header__logo-img" />
                </a>

                <nav className={`header__nav ${menuOpen ? 'header__nav--open' : ''}`}>
                    <a href="#calculator" className="header__link" onClick={() => setMenuOpen(false)}>Калькулятор</a>
                    <a href="#product" className="header__link" onClick={() => setMenuOpen(false)}>Купити</a>
                    <a href="#faq" className="header__link" onClick={() => setMenuOpen(false)}>FAQ</a>
                    <a href="https://t.me/hlorka_bot" target="_blank" rel="noopener noreferrer" className="header__phone" onClick={() => setMenuOpen(false)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                        Чат бот
                    </a>
                    <a href="tel:+380800334267" className="header__phone">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                        </svg>
                        0 800 334 267
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
