import { useState } from 'react';
import SectionWrapper from '../../Common components/SectionWrapper/SectionWrapper';
import Button from '../../Common components/Button/Button';
import LegalModal from '../../Common components/LegalModal/LegalModal';
import { publicOfferText, privacyPolicyText } from '../../Common components/LegalModal/LegalTexts';
import { trackContactClick } from '../../utils/analytics';
import logoImg from '../../Src/assets/images/logo.png';
import './TrustBlock.css';

const whyUsItems = [
    {
        icon: (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M8 10h.01" /><path d="M16 10h.01" /><path d="M8 14h.01" /><path d="M16 14h.01" /></svg>
        ),
        title: 'Вітчизняний виробник',
        text: 'Власне виробництво, гарантія якості',
    },
    {
        icon: (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
        ),
        title: 'Сертифікований засіб',
        text: 'Держ. реєстрація, документи в наявності',
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
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
        ),
        title: 'Доставка по всій Україні',
        text: 'Кур\'єр, нова пошта або самовивіз м. Київ',
    },
    {
        icon: (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
        ),
        title: 'Оплата при отриманні',
        text: 'Без передоплати, перевірка товару',
    },
    {
        icon: (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 102.13-9.36L1 10" /></svg>
        ),
        title: 'Повернення 14 днів',
        text: 'Гарантія повернення згідно закону',
    },
];

function TrustBlock() {
    const [legalModalConfig, setLegalModalConfig] = useState({ isOpen: false, title: '', content: '' });

    const openLegalModal = (title, content, e) => {
        e.preventDefault();
        setLegalModalConfig({ isOpen: true, title, content });
        // Prevent body scrolling
        document.body.style.overflow = 'hidden';
    };

    const closeLegalModal = () => {
        setLegalModalConfig(prev => ({ ...prev, isOpen: false }));
        // Restore body scrolling
        document.body.style.overflow = 'unset';
    };

    return (
        <>
            {/* ── "Чому саме ми?" block ──── */}
            <SectionWrapper bg="light" id="trust">
                <h2 className="why-us__title">Нас обирають тому що:</h2>
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
                        <a href="#" className="footer__logo" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                            <img src={logoImg} alt="Hlorka Logo" className="footer__logo-img" />
                        </a>

                        <div className="footer__columns">
                            <div className="footer__col">
                                <h4 className="footer__col-title">Контакти</h4>
                                <ul className="footer__list">
                                    <li>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.11 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>
                                        <a href="tel:+380800334267" className="footer__link" onClick={() => trackContactClick('phone')}>0 800 334 267</a>
                                    </li>
                                    <li>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                                        <a href="mailto:zakaz@hlorka.in.ua" className="footer__link">zakaz@hlorka.in.ua</a>
                                    </li>
                                    <li>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                            <polyline points="15 3 21 3 21 9"></polyline>
                                            <line x1="10" y1="14" x2="21" y2="3"></line>
                                        </svg>
                                        <a href="https://t.me/hlorka_bot" className="footer__link" target="_blank" rel="noopener noreferrer" onClick={() => trackContactClick('telegram')}>Чат бот</a>
                                    </li>
                                </ul>
                            </div>

                            <div className="footer__col">
                                <h4 className="footer__col-title">Важливі посилання</h4>
                                <ul className="footer__list">
                                <li><a href="https://hlorka.ua" className="footer__link footer__link--ups" target="_blank" rel="noopener noreferrer">Посилання на сайт</a></li>
                                    <li><a href="#" onClick={(e) => openLegalModal("Публічна оферта", publicOfferText, e)} className="footer__link footer__link--ups">Публічна оферта</a></li>
                                    <li><a href="#" onClick={(e) => openLegalModal("Політика конфіденційності", privacyPolicyText, e)} className="footer__link footer__link--ups">Політика конфіденційності</a></li>
                                </ul>
                            </div>
                        </div>

                        <p className="footer__copy">© 2026 Hlorka.ua — не тільки дезінфекція</p>
                    </div>

                    {/* Right: CTA */}
                    <div className="footer__cta">
                        <h2 className="footer__cta-title">Поверніть басейну <br /> чисту воду вже сьогодні</h2>
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
            
            <LegalModal 
                isOpen={legalModalConfig.isOpen}
                title={legalModalConfig.title}
                content={legalModalConfig.content}
                onClose={closeLegalModal}
            />
        </>
    );
}

export default TrustBlock;
