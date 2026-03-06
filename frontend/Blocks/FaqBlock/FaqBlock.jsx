import { useState } from 'react';
import SectionWrapper from '../../Common components/SectionWrapper/SectionWrapper';
import FaqItem from './FaqItem';
import './FaqBlock.css';

const faqData = [
    {
        question: 'Чи безпечно для дітей?',
        answer: 'Так. Після обробки перекис розкладається на воду та кисень. Через 24 години після обробки вода повністю безпечна для купання. Перекис не містить хлору та не викликає подразнення шкіри чи очей.',
    },
    {
        question: 'Чи можна купатися одразу після обробки?',
        answer: 'Рекомендуємо почекати 24 години після обробки. За цей час перекис повністю розкладеться і вода буде безпечною для купання.',
    },
    {
        question: 'Чи шкодить покриттю басейну?',
        answer: 'Ні. 50% перекис водню безпечний для всіх типів покриттів: плитка, плівка ПВХ, композитні матеріали. Він не знебарвлює та не руйнує поверхні.',
    },
    {
        question: 'Як правильно зберігати перекис?',
        answer: 'Зберігайте в оригінальній каністрі, в прохолодному темному місці, подалі від прямих сонячних променів. Температура зберігання: +5°C до +25°C. Термін придатності — 12 місяців.',
    },
    {
        question: 'Чи є запах?',
        answer: 'Перекис водню практично не має запаху. На відміну від хлору, він не створює неприємного хімічного аромату. Після обробки басейну вода пахне свіжістю.',
    },
];

function FaqBlock() {
    const [openIndex, setOpenIndex] = useState(null);

    const toggle = (index) => {
        setOpenIndex(prev => prev === index ? null : index);
    };

    return (
        <SectionWrapper bg="white" id="faq">
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
