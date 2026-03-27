function CalculatorTabs({ activeTab, onTabChange }) {
    const isVolume = activeTab === 'volume';

    return (
        <div className="calc-tabs">
            {/* Sliding pill indicator */}
            <div
                className="calc-tabs__indicator"
                style={{ transform: isVolume ? 'translateX(0)' : 'translateX(100%)' }}
            />
            <button
                className={`calc-tabs__btn ${isVolume ? 'calc-tabs__btn--active' : ''}`}
                onClick={() => onTabChange('volume')}
            >
                Знаю об'єм
            </button>
            <button
                className={`calc-tabs__btn ${!isVolume ? 'calc-tabs__btn--active' : ''}`}
                onClick={() => onTabChange('dimensions')}
            >
                За розмірами
            </button>
        </div>
    );
}

export default CalculatorTabs;
