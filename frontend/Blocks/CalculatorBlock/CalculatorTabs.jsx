function CalculatorTabs({ activeTab, onTabChange }) {
    return (
        <div className="calc-tabs">
            <button
                className={`calc-tabs__btn ${activeTab === 'dimensions' ? 'calc-tabs__btn--active' : ''}`}
                onClick={() => onTabChange('dimensions')}
            >
                За розмірами
            </button>
            <button
                className={`calc-tabs__btn ${activeTab === 'volume' ? 'calc-tabs__btn--active' : ''}`}
                onClick={() => onTabChange('volume')}
            >
                Знаю об'єм
            </button>
        </div>
    );
}

export default CalculatorTabs;
