import { useState } from 'react';
import SectionWrapper from '../../Common components/SectionWrapper/SectionWrapper';
import FaqItem from './FaqItem';
import './FaqBlock.css';

const faqData = [
    {
        question: 'Чи безпечно дітям?',
        answer: (
            <>
                Так, при правильному дозуванні перекис водню безпечний для купання дітей. Він не містить хлору, не викликає подразнення шкіри та очей і не має різкого запаху. Після розкладання перетворюється на воду та кисень.
            </>
        )
    },
    {
        question: 'Чи можна купатись одразу?',
        answer: (
            <>
                Після додавання перекису потрібно дати йому час подіяти та рівномірно розподілитися у воді.<br/><br/>
                Рекомендований час очікування залежить від рівня очистки:
                <ul className="faq-list" style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginTop: '8px', marginBottom: '8px', color: '#6B7280' }}>
                    <li style={{ marginBottom: '4px' }}><span style={{ color: '#4B5563' }}>Легка очистка — приблизно 12–16 годин</span></li>
                    <li style={{ marginBottom: '4px' }}><span style={{ color: '#4B5563' }}>Стандартна очистка — приблизно 16–20 годин</span></li>
                    <li style={{ marginBottom: '4px' }}><span style={{ color: '#4B5563' }}>Інтенсивна очистка — приблизно 20–24 години</span></li>
                </ul>
                Після цього вода стає чистою і безпечною для купання.
            </>
        )
    },
    {
        question: 'Як зберігати?',
        answer: (
            <>
                Зберігайте в щільно закритій тарі, у темному прохолодному місці, подалі від прямих сонячних променів та дітей. Не переливайте в інші ємності без необхідності.
            </>
        )
    },
    {
        question: 'Чи псує плівку басейну?',
        answer: (
            <>
                Ні, перекис водню не пошкоджує плівку басейну при дотриманні рекомендованого дозування. Він м’яко очищає воду без агресивного впливу на матеріали.
            </>
        )
    },
    {
        question: 'Чи можна оплатити при отриманні?',
        answer: (
            <>
                Так, доступна оплата при отриманні у відділенні служби доставки.
            </>
        )
    }
];

function FaqBlock() {
    const [openIndex, setOpenIndex] = useState(null);

    const toggle = (index) => {
        setOpenIndex(prev => prev === index ? null : index);
    };

    return (
        <SectionWrapper bg="light" id="faq">
            <h2 className="faq__title">Часті запитання</h2>
            <div className="faq__list">
                {faqData.map((item, i) => (
                    <FaqItem
                        key={i}
                        question={item.question}
                        answer={item.answer}
                        isOpen={openIndex === i}
                        onToggle={() => toggle(i)}
                    />
                ))}
            </div>
        </SectionWrapper>
    );
}

export default FaqBlock;
