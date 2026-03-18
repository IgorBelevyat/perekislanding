import SectionWrapper from '../../Common components/SectionWrapper/SectionWrapper';
import Button from '../../Common components/Button/Button';
import heroPool from '../../Src/assets/images/hero-pool.png';
import './HeroBlock.css';

function HeroBlock() {
    const benefits = [
        {
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" /></svg>
            ),
            text: 'Без запаху хлору — комфорт для всієї сім\'ї',
        },
        {
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" />
                </svg>
            ),
            text: 'Економія 40 % порівняно з хлором',
        },
        {
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            ),
            text: 'Безпечно при правильному дозуванні',
        },
        {
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                </svg>
            ),
            text: 'Нічого зайвого — розкладається на воду та кисень',
        },
    ];

    return (
        <section className="hero" id="hero">
            <div className="hero__inner">
                <div className="hero__content">
                    <h1 className="hero__title">
                        Зелена вода в басейні? Очистіть її за 24 години <span className="hero__title-accent">без хлору</span>
                        <span className="hero__title-sub">Медичний перекис водню 50% для очищення приватних басейнів.</span>
                    </h1>

                    <p className="hero__subtitle">
                        Простий розрахунок, зрозуміле дозування, швидкий результат.
                    </p>

                    <ul className="hero__benefits">
                        {benefits.map((b, i) => (
                            <li key={i} className="hero__benefit">
                                <span className="hero__benefit-icon">{b.icon}</span>
                                <span>{b.text}</span>
                            </li>
                        ))}
                    </ul>

                    <div className="hero__cta">
                        <Button variant="primary" size="lg" onClick={() => document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' })}>
                            Розрахувати дозування
                        </Button>
                        <Button variant="cta" size="lg" onClick={() => document.getElementById('product')?.scrollIntoView({ behavior: 'smooth' })}>
                            Купити
                        </Button>
                    </div>
                    <p className="hero__cta-note"><span className="hero__cta-note-star">*</span>без дзвінків і консультацій</p>
                </div>

                <div className="hero__image-wrapper">
                    <img src={heroPool} alt="Чистий басейн з прозорою блакитною водою" className="hero__image" />
                    <div className="hero__image-badge">
                        <span className="hero__badge-text">Перевірено</span>
                        <span className="hero__badge-sub">14 000+ басейнів</span>
                    </div>
                </div>

                <div className="hero__scroll-indicator" aria-hidden="true" onClick={() => document.getElementById('problem')?.scrollIntoView({ behavior: 'smooth' })}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
            </div>
        </section>
    );
}

export default HeroBlock;
