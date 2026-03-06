import SectionWrapper from '../../Common components/SectionWrapper/SectionWrapper';
import './ComparisonBlock.css';

const IconX = () => (
    <svg className="comparison__svg comparison__svg--neg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" opacity="0.15" fill="currentColor" stroke="none" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
);

const IconCheck = () => (
    <svg className="comparison__svg comparison__svg--pos" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" opacity="0.15" fill="currentColor" stroke="none" /><polyline points="9 12 11.5 14.5 16 9.5" /></svg>
);

const data = [
    { param: 'Запах', chlorine: 'Різкий хімічний', peroxide: 'Відсутній', chlorineNeg: true, peroxidePos: true },
    { param: 'Подразнення шкіри та очей', chlorine: 'Так, часто', peroxide: 'Ні', chlorineNeg: true, peroxidePos: true },
    { param: 'Складність дозування', chlorine: 'Висока, потребує досвіду', peroxide: 'Проста — калькулятор', chlorineNeg: true, peroxidePos: true },
    { param: 'Вартість обробки', chlorine: 'Вища', peroxide: 'Дешевше на 30–40%', chlorineNeg: true, peroxidePos: true },
    { param: 'Безпека для дітей', chlorine: 'Обмежена', peroxide: 'Безпечно після 24 год', chlorineNeg: true, peroxidePos: true },
    { param: 'Залишок у воді', chlorine: 'Хлораміни', peroxide: 'Вода + кисень', chlorineNeg: true, peroxidePos: true },
];

function ComparisonBlock() {
    return (
        <SectionWrapper bg="white" id="comparison">
            <h2 className="comparison__title">Порівняння з хлором</h2>

            {/* Desktop Table */}
            <div className="comparison__table-wrapper">
                <table className="comparison__table">
                    <thead>
                        <tr>
                            <th className="comparison__th">Параметр</th>
                            <th className="comparison__th comparison__th--chlorine">Хлор</th>
                            <th className="comparison__th comparison__th--peroxide">Перекис 50%</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, i) => (
                            <tr key={i} className="comparison__row">
                                <td className="comparison__param">{row.param}</td>
                                <td className="comparison__cell comparison__cell--neg">
                                    <IconX />
                                    {row.chlorine}
                                </td>
                                <td className="comparison__cell comparison__cell--pos">
                                    <IconCheck />
                                    {row.peroxide}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="comparison__cards">
                {data.map((row, i) => (
                    <div key={i} className="comparison-card">
                        <p className="comparison-card__param">{row.param}</p>
                        <div className="comparison-card__row">
                            <div className="comparison-card__item comparison-card__item--neg">
                                <span className="comparison-card__label">Хлор</span>
                                <span className="comparison-card__value"><IconX /> {row.chlorine}</span>
                            </div>
                            <div className="comparison-card__item comparison-card__item--pos">
                                <span className="comparison-card__label">Перекис</span>
                                <span className="comparison-card__value"><IconCheck /> {row.peroxide}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </SectionWrapper>
    );
}

export default ComparisonBlock;
