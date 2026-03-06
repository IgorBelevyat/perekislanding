import './ProblemBlock.css';
import ProblemCard from './ProblemCard';
import SectionWrapper from '../../Common components/SectionWrapper/SectionWrapper';

function ProblemBlock() {
    const problems = [
        {
            icon: (
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <circle cx="20" cy="20" r="20" fill="#FEF3C7" />
                    <path d="M20 12v8M20 24h.01" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="20" cy="20" r="10" stroke="#F59E0B" strokeWidth="2" fill="none" />
                </svg>
            ),
            title: 'Чому зеленіє вода?',
            text: 'Сонце, бактерії та водорості перетворюють басейн у болото за кілька днів без правильної обробки.',
        },
        {
            icon: (
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <circle cx="20" cy="20" r="20" fill="#FEE2E2" />
                    <path d="M15 15l10 10M25 15L15 25" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
            ),
            title: 'Чому хлор — не ідеальний?',
            text: 'Різкий запах, подразнення очей і шкіри, складне дозування, небезпечно для дітей та алергіків.',
        },
        {
            icon: (
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <circle cx="20" cy="20" r="20" fill="#D1FAE5" />
                    <path d="M14 20l4 4 8-8" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
            title: 'Перекис 50% — простіше',
            text: 'Без запаху, безпечно для шкіри, просте дозування. Розкладається на воду та кисень — нічого зайвого.',
        },
    ];

    return (
        <SectionWrapper bg="white" id="problem">
            <div className="problem">
                <h2 className="problem__title">
                    Проблема <span className="problem__title-divider">→</span> Рішення
                </h2>
                <div className="problem__grid">
                    {problems.map((p, i) => (
                        <ProblemCard key={i} icon={p.icon} title={p.title} text={p.text} />
                    ))}
                </div>
            </div>
        </SectionWrapper>
    );
}

export default ProblemBlock;
