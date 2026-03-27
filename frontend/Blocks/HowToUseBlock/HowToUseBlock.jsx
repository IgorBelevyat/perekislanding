import SectionWrapper from '../../Common components/SectionWrapper/SectionWrapper';
import './HowToUseBlock.css';

const steps = [
    {
        num: '01',
        title: 'Розрахуйте дозування',
        text: 'Введіть розміри басейну в калькулятор і отримайте точну кількість перекису.',
        icon: (
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                <circle cx="28" cy="28" r="28" fill="#E0F4F9" />
                <rect x="18" y="16" width="20" height="24" rx="2" stroke="#0096B8" strokeWidth="2" fill="none" />
                <line x1="18" y1="22" x2="38" y2="22" stroke="#0096B8" strokeWidth="2" />
                <line x1="23" y1="28" x2="33" y2="28" stroke="#0096B8" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="28" y1="23" x2="28" y2="33" stroke="#0096B8" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="23" y1="36" x2="33" y2="36" stroke="#0096B8" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        num: '02',
        title: 'Додайте у воду',
        text: 'Рівномірно розлийте перекис по поверхні води або біля форсунки подачі.',
        icon: (
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                <circle cx="28" cy="28" r="28" fill="#E0F4F9" />
                <path d="M28 18l6.5 6.5a9.19 9.19 0 11-13 0z" stroke="#0096B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
        ),
    },
    {
        num: '03',
        title: 'Перемішайте насосом',
        text: 'Увімкніть фільтрацію на 2–4 години. Через 24 години вода готова до купання.',
        icon: (
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                <circle cx="28" cy="28" r="28" fill="#E0F4F9" />
                <circle cx="28" cy="28" r="9" stroke="#0096B8" strokeWidth="2" fill="none" />
                <path d="M28 19v-3M28 40v-3M37 28h3M16 28h3" stroke="#0096B8" strokeWidth="2" strokeLinecap="round" />
                <path d="M25 26l3 2 3-2" stroke="#0096B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <path d="M25 29l3 2 3-2" stroke="#0096B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
        ),
    },
];

function HowToUseBlock() {
    return (
        <SectionWrapper bg="light" id="how-to-use">
            <h2 className="howto__title">Як використовувати</h2>
            <p className="howto__subtitle">Три простих кроки до чистої води</p>
            <div className="howto__grid">
                {steps.map((step, i) => (
                    <div key={i} className="howto-step">
                        <div className="howto-step__icon">{step.icon}</div>
                        <div className="howto-step__num">{step.num}</div>
                        <h3 className="howto-step__title">{step.title}</h3>
                        <p className="howto-step__text">{step.text}</p>
                        {i < steps.length - 1 && (
                            <div className="howto-step__arrow">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M5 12h14M13 6l6 6-6 6" stroke="#0096B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                <span style={{ color: '#E53E3E', fontSize: '15px', marginRight: '4px' }}>*</span>
                <a
                    href="#safety"
                    style={{
                        color: '#4B5563',
                        fontSize: '13px',
                        textDecoration: 'underline',
                        textUnderlineOffset: '3px',
                        transition: 'color 0.2s ease',
                        display: 'inline-block'
                    }}
                    onMouseEnter={(e) => e.target.style.color = '#0096B8'}
                    onMouseLeave={(e) => e.target.style.color = '#4B5563'}
                >
                    повна інструкція з використання
                </a>
            </div>
        </SectionWrapper>
    );
}

export default HowToUseBlock;
