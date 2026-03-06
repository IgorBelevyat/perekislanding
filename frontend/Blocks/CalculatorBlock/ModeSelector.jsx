function ModeSelector({ modes, selected, onSelect }) {
    return (
        <div className="mode-selector">
            <p className="mode-selector__label">Режим очистки</p>
            <div className="mode-selector__options">
                {modes.map(mode => (
                    <div
                        key={mode.id}
                        className={`mode-option ${selected === mode.id ? 'mode-option--active' : ''}`}
                        onClick={() => onSelect(mode.id)}
                    >
                        {mode.recommended && (
                            <span className="mode-option__badge">Рекомендовано</span>
                        )}
                        <p className="mode-option__title">{mode.label}</p>
                        <p className="mode-option__desc">{mode.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ModeSelector;
