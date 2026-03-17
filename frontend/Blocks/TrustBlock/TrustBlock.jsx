import SectionWrapper from '../../Common components/SectionWrapper/SectionWrapper';
import Button from '../../Common components/Button/Button';
import logoImg from '../../Src/assets/images/logo.png';
import './TrustBlock.css';

const whyUsItems = [
    {
        icon: (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
        ),
        title: 'Доставка Новою Поштою',
        text: 'По всій Україні, 1–3 робочих дні',
    },
    {
        icon: (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
        ),
        title: 'Оплата при отриманні',
        text: 'Або онлайн — Apple Pay, Google Pay, карткою',
    },
    {
        icon: (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 102.13-9.36L1 10" /></svg>
        ),
        title: 'Повернення 14 днів',
        text: 'Гарантія повернення згідно закону',
    },
    {
        icon: (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
        ),
        title: 'Сертифікований засіб',
        text: 'Вітчизняне виробництво, документи в наявності',
    },
    {
        icon: (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>
        ),
        title: '14 000+ задоволених клієнтів',
        text: 'Перевірено протягом 5+ сезонів',
    },
    {
        icon: (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.11 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>
        ),
        title: 'Консультація безкоштовно',
        text: 'Допоможемо підібрати дозування',
    },
];

function TrustBlock() {
    return (
        <>
            {/* ── "Чому саме ми?" block ──── */}
            <SectionWrapper bg="light" id="trust">
                <h2 className="why-us__title">Чому саме ми?</h2>
                <div className="why-us__grid">
                    {whyUsItems.map((item, i) => (
                        <div key={i} className="why-us__card">
                            <div className="why-us__icon">{item.icon}</div>
                            <h3 className="why-us__card-title">{item.title}</h3>
                            <p className="why-us__card-text">{item.text}</p>
                        </div>
                    ))}
                </div>
            </SectionWrapper>

            {/* ── Dark footer ──── */}
            <footer className="footer">
                <div className="footer__inner">
                    {/* Left: Contacts & Legal */}
                    <div className="footer__info">
                        <a href="https://hlorka.ua" className="footer__logo" target="_blank" rel="noopener noreferrer">
                            <img src={logoImg} alt="Hlorka Logo" className="footer__logo-img" />
                        </a>

                        <div className="footer__columns">
                            <div className="footer__col">
                                <h4 className="footer__col-title">Контакти</h4>
                                <ul className="footer__list">
                                    <li>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.11 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>
                                        <a href="tel:+380883354267" className="footer__link">0 883 354 267</a>
                                    </li>
                                    <li>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                                        <a href="mailto:info@hlorka.ua" className="footer__link">info@hlorka.ua</a>
                                    </li>
                                </ul>
                            </div>

                            <div className="footer__col">
                                <h4 className="footer__col-title">Реквізити</h4>
                                <p className="footer__legal">ФОП / ТОВ — юридична інформація.<br />Всі права захищені.</p>
                            </div>
                        </div>

                        <p className="footer__copy">© 2026 Hlorka.ua — Професійна хімія для басейнів</p>
                    </div>

                    {/* Right: CTA */}
                    <div className="footer__cta">
                        <h2 className="footer__cta-title">Тепер готові купити?</h2>
                        <p className="footer__cta-text">
                            Розрахуйте дозування або замовте перекис 50% прямо зараз
                        </p>
                        <div className="footer__cta-buttons">
                            <Button variant="primary" size="lg" onClick={() => document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' })}>
                                Розрахувати дозування
                            </Button>
                            <Button variant="cta" size="lg" onClick={() => document.getElementById('product')?.scrollIntoView({ behavior: 'smooth' })}>
                                Купити зараз
                            </Button>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    );
}

export default TrustBlock;
