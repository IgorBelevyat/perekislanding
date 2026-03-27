import { useState, useEffect } from 'react';
import SectionWrapper from '../../Common components/SectionWrapper/SectionWrapper';
import certificatePdf from '../../Src/assets/FIles/Certificate.pdf';
import instructionPdf from '../../Src/assets/FIles/Instruction.pdf';
import './SafetyBlock.css';

/* ── SVG Icons (matching site style — thin stroke, rounded) ──── */
const IconSafety = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
);

const IconFlask = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 3h6M10 3v5.172a2 2 0 0 1-.586 1.414L4 15c-1.5 1.5-.5 4 2 4h12c2.5 0 3.5-2.5 2-4l-5.414-5.414A2 2 0 0 1 14 8.172V3"/>
    </svg>
);

const IconClock = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 6v6l4 2"/>
    </svg>
);

const IconCheck = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
);

const IconWarning = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
);

const IconBan = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
    </svg>
);

const IconNote = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
    </svg>
);

const IconCert = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
    </svg>
);

const IconExternal = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
        <polyline points="15 3 21 3 21 9"/>
        <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
);

function SafetyBlock() {
    const [openIndex, setOpenIndex] = useState(null);

    useEffect(() => {
        const handleOpenEvent = () => setOpenIndex(0);
        window.addEventListener('open-safety-rules', handleOpenEvent);
        return () => window.removeEventListener('open-safety-rules', handleOpenEvent);
    }, []);

    const toggle = (index) => {
        setOpenIndex(prev => prev === index ? null : index);
    };

    return (
        <SectionWrapper bg="white" id="safety">
            <h2 className="safety__title">Правила безпечного використання</h2>
            <p className="safety__subtitle">
                Коротко про безпечне використання та перевірку води перед купанням
            </p>

            <div className="safety__list">
                {/* Item 1: Expandable rules */}
                <div id="safety-rules" className={`safety-item ${openIndex === 0 ? 'safety-item--open' : ''}`} style={{ scrollMarginTop: '100px' }}>
                    <button className="safety-item__header" onClick={() => toggle(0)} aria-expanded={openIndex === 0}>
                        <div className="safety-item__header-left">
                            <span className="safety-item__icon-left"><IconSafety /></span>
                            <span>Правила безпечного використання</span>
                        </div>
                        <span className={`safety-item__toggle ${openIndex === 0 ? 'safety-item__toggle--open' : ''}`}>
                            {openIndex === 0 ? '−' : '+'}
                        </span>
                    </button>

                    <div className={`safety-item__content-wrapper ${openIndex === 0 ? 'safety-item__content-wrapper--open' : ''}`}>
                        <div className="safety-item__content">
                            <p className="safety-item__intro">
                                Розрахунок у калькуляторі є орієнтовним і залежить від початкового стану води.
                                Після внесення засобу рекомендуємо утриматись від купання,
                                доки вода не очиститься та не стане безпечною.
                            </p>

                            <div className="safety-item__section">
                                <h4 className="safety-item__section-title">
                                    <span className="safety-item__section-icon"><IconFlask /></span>
                                    Щоб вода була безпечною для купання:
                                </h4>
                                <ul className="safety-item__list">
                                    <li>гарантуйте безперервну роботу насоса протягом 6–12 годин</li>
                                    <li>дочекайтесь, поки вода стане прозорою, без осаду та різкого запаху</li>
                                    <li>перевірте, що рівень pH знаходиться в межах 7.2–7.6</li>
                                </ul>
                            </div>

                            <div className="safety-item__section">
                                <h4 className="safety-item__section-title">
                                    <span className="safety-item__section-icon"><IconClock /></span>
                                    Рекомендуємо витримати:
                                </h4>
                                <ul className="safety-item__list">
                                    <li>не менше 24 годин при легкій обробці</li>
                                    <li>до 48 годин при інтенсивній очистці</li>
                                </ul>
                            </div>

                            <div className="safety-item__section">
                                <h4 className="safety-item__section-title">
                                    <span className="safety-item__section-icon"><IconCheck /></span>
                                    Перед купанням обов'язково:
                                </h4>
                                <ul className="safety-item__list">
                                    <li>перевірити прозорість води</li>
                                    <li>перевірити pH тест-смужками</li>
                                    <li>переконатися у відсутності осаду</li>
                                </ul>
                            </div>

                            <div className="safety-item__section safety-item__section--warning">
                                <h4 className="safety-item__section-title">
                                    <span className="safety-item__section-icon safety-item__section-icon--warning"><IconWarning /></span>
                                    Обережно
                                </h4>
                                <p>Перекис водню 50% — це концентрований реагент:</p>
                                <ul className="safety-item__list">
                                    <li>використовуйте рукавички</li>
                                    <li>уникайте контакту зі шкірою та очима</li>
                                    <li>не допускайте розбризкування</li>
                                    <li>не вдихайте пари</li>
                                </ul>
                            </div>

                            <div className="safety-item__section safety-item__section--danger">
                                <h4 className="safety-item__section-title">
                                    <span className="safety-item__section-icon safety-item__section-icon--danger"><IconBan /></span>
                                    Заборонено
                                </h4>
                                <ul className="safety-item__list">
                                    <li>змішувати з хлором</li>
                                    <li>змішувати з іншими хімічними засобами</li>
                                </ul>
                            </div>

                            <div className="safety-item__section safety-item__section--note">
                                <h4 className="safety-item__section-title">
                                    <span className="safety-item__section-icon safety-item__section-icon--note"><IconNote /></span>
                                    Зверніть увагу
                                </h4>
                                <p>
                                    Результати очищення води можуть відрізнятись залежно від об'єму басейну,
                                    температури, рівня забруднення та роботи фільтраційної системи.
                                </p>
                                <p>
                                    Розрахунок у калькуляторі є орієнтовним і слугує базовою рекомендацією для підбору дозування.
                                    Перед використанням басейну рекомендуємо перевірити прозорість води та рівень pH.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Item 2: Certificate PDF link */}
                <a
                    id="certificates"
                    href={certificatePdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="safety-item safety-item--link"
                    style={{ scrollMarginTop: '100px' }}
                >
                    <div className="safety-item__header safety-item__header--link">
                        <div className="safety-item__header-left">
                            <span className="safety-item__icon-left"><IconCert /></span>
                            <span>Сертифікати якості</span>
                        </div>
                        <span className="safety-item__external-icon"><IconExternal /></span>
                    </div>
                </a>

                {/* Item 3: Instruction PDF link */}
                <a
                    href={instructionPdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="safety-item safety-item--link"
                >
                    <div className="safety-item__header safety-item__header--link">
                        <div className="safety-item__header-left">
                            <span className="safety-item__icon-left"><IconCert /></span>
                            <span>Повна інструкція з використання</span>
                        </div>
                        <span className="safety-item__external-icon"><IconExternal /></span>
                    </div>
                </a>
            </div>
        </SectionWrapper>
    );
}

export default SafetyBlock;
