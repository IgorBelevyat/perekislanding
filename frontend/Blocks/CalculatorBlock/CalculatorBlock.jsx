import { useState, useMemo } from 'react';
import SectionWrapper from '../../Common components/SectionWrapper/SectionWrapper';
import CalculatorTabs from './CalculatorTabs';
import CalculatorInputs from './CalculatorInputs';
import ModeSelector from './ModeSelector';
import CalculatorResult from './CalculatorResult';
import './CalculatorBlock.css';

const DENSITY = 1.2; // кг/л
const CANISTER_KG = 5;
const CANISTER_LITERS = CANISTER_KG / DENSITY; // ≈ 4.17 л

const MODES = [
    { id: 'prevention', label: 'Профілактика', k: 0.5, description: 'Регулярне підтримання чистоти' },
    { id: 'standard', label: 'Стандартна', k: 0.7, description: 'Рекомендовано для більшості басейнів', recommended: true },
    { id: 'shock', label: 'Шокова', k: 1.0, description: 'Сильне забруднення або перший запуск' },
];

function CalculatorBlock() {
    const [inputMode, setInputMode] = useState('dimensions'); // dimensions | volume
    const [length, setLength] = useState('');
    const [width, setWidth] = useState('');
    const [depth, setDepth] = useState('');
    const [volume, setVolume] = useState('');
    const [cleaningMode, setCleaningMode] = useState('standard');

    const selectedMode = MODES.find(m => m.id === cleaningMode);

    const calculatedVolume = useMemo(() => {
        if (inputMode === 'dimensions') {
            const l = parseFloat(String(length).replace(',', '.'));
            const w = parseFloat(String(width).replace(',', '.'));
            const d = parseFloat(String(depth).replace(',', '.'));
            if (l > 0 && w > 0 && d > 0) return l * w * d;
            return null;
        } else {
            const v = parseFloat(String(volume).replace(',', '.'));
            return v > 0 ? v : null;
        }
    }, [inputMode, length, width, depth, volume]);

    const result = useMemo(() => {
        if (!calculatedVolume || !selectedMode) return null;
        const liters = calculatedVolume * selectedMode.k;
        const canisters = Math.ceil(liters / CANISTER_LITERS);
        return { volume: calculatedVolume, liters: Math.round(liters * 100) / 100, canisters };
    }, [calculatedVolume, selectedMode]);

    return (
        <SectionWrapper bg="light" id="calculator">
            <div className="calculator">
                <h2 className="calculator__title">Розрахуйте дозування</h2>
                <p className="calculator__subtitle">
                    Введіть параметри вашого басейну та отримайте точний розрахунок
                </p>

                <div className="calculator__card">
                    <CalculatorTabs activeTab={inputMode} onTabChange={setInputMode} />

                    <CalculatorInputs
                        mode={inputMode}
                        length={length}
                        width={width}
                        depth={depth}
                        volume={volume}
                        onLengthChange={setLength}
                        onWidthChange={setWidth}
                        onDepthChange={setDepth}
                        onVolumeChange={setVolume}
                    />

                    <ModeSelector
                        modes={MODES}
                        selected={cleaningMode}
                        onSelect={setCleaningMode}
                    />

                    {result && (
                        <CalculatorResult
                            volume={result.volume}
                            liters={result.liters}
                            canisters={result.canisters}
                            kValue={selectedMode?.k}
                        />
                    )}
                </div>
            </div>
        </SectionWrapper>
    );
}

export default CalculatorBlock;
