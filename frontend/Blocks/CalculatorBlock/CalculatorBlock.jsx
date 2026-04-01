import { useState, useMemo, useEffect, useRef } from 'react';
import { trackCalculatorUsed } from '../../utils/analytics';
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
    { id: 'prevention', label: 'Легка очистка', k: 0.35, description: 'Для регулярного підтримання чистоти' },
    { id: 'standard', label: 'Стандартна очистка', k: 0.5, description: 'Для більшості випадків забруднень середньої інтенсивності', recommended: true },
    { id: 'shock', label: 'Інтенсивна очистка', k: 0.7, description: 'Для сильно забрудненої води' },
];

function CalculatorBlock() {
    const [inputMode, setInputMode] = useState('volume'); // volume | dimensions
    const [poolShape, setPoolShape] = useState('circular'); // circular | rectangular
    const [length, setLength] = useState('');
    const [width, setWidth] = useState('');
    const [depth, setDepth] = useState('');
    const [diameter, setDiameter] = useState('');
    const [volume, setVolume] = useState('');
    const [cleaningMode, setCleaningMode] = useState('standard');
    const contentRef = useRef(null);

    const selectedMode = MODES.find(m => m.id === cleaningMode);

    const calculatedVolume = useMemo(() => {
        if (inputMode === 'dimensions') {
            if (poolShape === 'circular') {
                const d = parseFloat(String(diameter).replace(',', '.'));
                const h = parseFloat(String(depth).replace(',', '.'));
                if (d > 0 && h > 0) {
                    // V = π × (D/2)² × H
                    const radius = d / 2;
                    return Math.PI * radius * radius * h;
                }
                return null;
            } else {
                const l = parseFloat(String(length).replace(',', '.'));
                const w = parseFloat(String(width).replace(',', '.'));
                const d = parseFloat(String(depth).replace(',', '.'));
                if (l > 0 && w > 0 && d > 0) return l * w * d;
                return null;
            }
        } else {
            const v = parseFloat(String(volume).replace(',', '.'));
            return v > 0 ? v : null;
        }
    }, [inputMode, poolShape, length, width, depth, diameter, volume]);

    const result = useMemo(() => {
        if (!calculatedVolume || !selectedMode) return null;
        const liters = calculatedVolume * selectedMode.k;
        const canisters = Math.ceil(liters / CANISTER_LITERS);
        return { volume: calculatedVolume, liters: Math.round(liters * 100) / 100, canisters };
    }, [calculatedVolume, selectedMode]);

    // Track calculator usage (debounced to avoid spamming while typing)
    useEffect(() => {
        if (!result) return;
        const handler = setTimeout(() => {
            trackCalculatorUsed(result.volume, result.canisters);
        }, 1500);
        return () => clearTimeout(handler);
    }, [result]);

    // Smooth height animation when switching modes
    useEffect(() => {
        const el = contentRef.current;
        if (!el) return;
        // Capture current height
        const prevHeight = el.offsetHeight;
        // Trigger reflow to measure new height
        el.style.height = 'auto';
        const newHeight = el.offsetHeight;
        // Animate from old to new
        el.style.height = prevHeight + 'px';
        // Force reflow
        el.getBoundingClientRect();
        el.style.height = newHeight + 'px';
        const onEnd = () => { el.style.height = 'auto'; };
        el.addEventListener('transitionend', onEnd, { once: true });
        return () => el.removeEventListener('transitionend', onEnd);
    }, [inputMode, poolShape]);

    return (
        <SectionWrapper bg="light" id="calculator">
            <div className="calculator">
                <h2 className="calculator__title">Розрахуйте точне дозування <br /> саме під ваш басейн</h2>
                <p className="calculator__subtitle">
                    Введіть параметри вашого басейну та отримайте точний розрахунок
                </p>

                <div className="calculator__card">
                    <CalculatorTabs activeTab={inputMode} onTabChange={setInputMode} />

                    <div className="calculator__content" ref={contentRef}>
                        {inputMode === 'dimensions' && (
                            <div className="calc-shape-section">
                                <p className="calc-shape-section__label">Оберіть форму вашого басейну</p>
                                <div className="calc-shape-toggle">
                                    <div
                                        className="calc-shape-toggle__indicator"
                                        style={{ transform: poolShape === 'circular' ? 'translateX(0)' : 'translateX(100%)' }}
                                    />
                                    <button
                                        className={`calc-shape-toggle__btn ${poolShape === 'circular' ? 'calc-shape-toggle__btn--active' : ''}`}
                                        onClick={() => setPoolShape('circular')}
                                    >
                                        Круглий
                                    </button>
                                    <button
                                        className={`calc-shape-toggle__btn ${poolShape === 'rectangular' ? 'calc-shape-toggle__btn--active' : ''}`}
                                        onClick={() => setPoolShape('rectangular')}
                                    >
                                        Прямокутний
                                    </button>
                                </div>
                            </div>
                        )}

                        <CalculatorInputs
                            mode={inputMode}
                            poolShape={poolShape}
                            length={length}
                            width={width}
                            depth={depth}
                            diameter={diameter}
                            volume={volume}
                            onLengthChange={setLength}
                            onWidthChange={setWidth}
                            onDepthChange={setDepth}
                            onDiameterChange={setDiameter}
                            onVolumeChange={setVolume}
                        />

                        <ModeSelector
                            modes={MODES}
                            selected={cleaningMode}
                            onSelect={setCleaningMode}
                        />
                    </div>

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
