function CalculatorInputs({ mode, length, width, depth, volume, onLengthChange, onWidthChange, onDepthChange, onVolumeChange }) {
    const handleNumberInput = (setter) => (e) => {
        const val = e.target.value;
        // Allow empty, digits, and one decimal point
        if (val === '' || /^\d*\.?\d*$/.test(val)) {
            setter(val);
        }
    };

    if (mode === 'dimensions') {
        return (
            <div className="calc-inputs calc-inputs--dimensions">
                <div className="calc-input-group">
                    <label className="calc-input-group__label">Довжина (м)</label>
                    <input
                        type="text"
                        inputMode="decimal"
                        className="calc-input-group__input"
                        placeholder="Напр. 8"
                        value={length}
                        onChange={handleNumberInput(onLengthChange)}
                    />
                </div>
                <div className="calc-input-group">
                    <label className="calc-input-group__label">Ширина (м)</label>
                    <input
                        type="text"
                        inputMode="decimal"
                        className="calc-input-group__input"
                        placeholder="Напр. 4"
                        value={width}
                        onChange={handleNumberInput(onWidthChange)}
                    />
                </div>
                <div className="calc-input-group">
                    <label className="calc-input-group__label">Глибина (м)</label>
                    <input
                        type="text"
                        inputMode="decimal"
                        className="calc-input-group__input"
                        placeholder="Напр. 1.5"
                        value={depth}
                        onChange={handleNumberInput(onDepthChange)}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="calc-inputs">
            <div className="calc-input-group">
                <label className="calc-input-group__label">Об'єм басейну (м³)</label>
                <input
                    type="text"
                    inputMode="decimal"
                    className="calc-input-group__input"
                    placeholder="Напр. 48"
                    value={volume}
                    onChange={handleNumberInput(onVolumeChange)}
                />
            </div>
        </div>
    );
}

export default CalculatorInputs;
