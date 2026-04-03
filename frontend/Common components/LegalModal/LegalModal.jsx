import './LegalModal.css';

// Section titles to highlight (both documents)
const SECTION_TITLES = [
    // Public Offer sections
    '1. Визначення термінів',
    '2. Предмет Договору',
    '3. Оформлення Замовлення',
    '4. Ціна і Доставка Товару',
    '5. Права та обов\'язки Сторін',
    '6. Повернення Товару',
    '7. Відповідальність',
    '8. Конфіденційність і захист персональних даних',
    '9. Інші умови',
    'АДРЕСА ТА РЕКВІЗИТИ ПРОДАВЦЯ:',
    // Privacy Policy sections
    'Вступ',
    'Мета обробки персональних даних',
    'Персональні дані користувача, що можуть оброблюватися при використанні веб-сайту:',
    'Форми і способи обробки персональних даних',
    'Права користувача',
    'Право доступу',
    'Право на виправлення',
    'Право на видалення даних',
    'Право на обмеження обробки',
    'Право на перенесення даних',
    'Право на заперечення',
    'Право на подачу скарги в наглядовий орган',
    'Здійснення своїх прав',
    'Протоколювання на веб-серверах',
    'Файли Cookies',
    'Форма зворотного зв\'язку',
    'Розкриття даних третім особам',
    'Обробка даних за межами ЄС',
    'Google Analytics',
    'Google AdSense',
    'Google Adwords / Відстеження конверсій',
    'Google Remarketing / Double Click',
    'Оновлення політики конфіденційності',
];

function parseLegalText(text) {
    const lines = text.split('\n');
    const elements = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip empty lines - add spacing
        if (line === '') {
            continue;
        }
        
        // Check if this line is a section title
        const isTitle = SECTION_TITLES.some(title => line === title || line.startsWith(title));
        
        if (isTitle) {
            elements.push(
                <h3 key={`h-${i}`} className="legal-modal__section-title">{line}</h3>
            );
        } else if (line.startsWith('•')) {
            elements.push(
                <p key={`b-${i}`} className="legal-modal__bullet">{line}</p>
            );
        } else {
            elements.push(
                <p key={`p-${i}`} className="legal-modal__paragraph">{line}</p>
            );
        }
    }
    
    return elements;
}

function LegalModal({ isOpen, onClose, title, content }) {
    if (!isOpen && typeof window === 'undefined') return null;

    return (
        <div 
            className={`legal-modal__overlay ${isOpen ? 'legal-modal__overlay--open' : ''}`}
            onClick={(e) => {
                if (e.target.classList.contains('legal-modal__overlay')) {
                    onClose();
                }
            }}
        >
            <div className="legal-modal__container">
                <div className="legal-modal__header">
                    <h2 className="legal-modal__title">{title}</h2>
                    <button className="legal-modal__close" onClick={onClose} aria-label="Закрити">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                
                <div className="legal-modal__body">
                    {typeof content === 'string' ? parseLegalText(content) : content}
                </div>

                <div className="legal-modal__footer">
                    <button className="legal-modal__footer-btn" onClick={onClose}>
                        Закрити
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LegalModal;
