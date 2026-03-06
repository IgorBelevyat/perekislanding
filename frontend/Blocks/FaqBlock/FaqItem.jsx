function FaqItem({ question, answer, isOpen, onToggle }) {
    return (
        <div className={`faq-item ${isOpen ? 'faq-item--open' : ''}`}>
            <button className="faq-item__question" onClick={onToggle} aria-expanded={isOpen}>
                <span>{question}</span>
                <span className={`faq-item__icon ${isOpen ? 'faq-item__icon--open' : ''}`}>
                    {isOpen ? '−' : '+'}
                </span>
            </button>
            <div className={`faq-item__answer-wrapper ${isOpen ? 'faq-item__answer-wrapper--open' : ''}`}>
                <p className="faq-item__answer">{answer}</p>
            </div>
        </div>
    );
}

export default FaqItem;
