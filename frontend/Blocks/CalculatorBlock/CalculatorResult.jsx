import Button from '../../Common components/Button/Button';
import { useCart } from '../../Stores/CartContext';

function CalculatorResult({ volume, liters, canisters }) {
    const { addToCart } = useCart();

    const handleAddToCart = () => {
        addToCart(
            { id: 'peroxide-50', name: 'Перекис водню 50%, 5 кг', price: 340 },
            canisters
        );
    };

    return (
        <div className="calc-result">
            <div className="calc-result__row">
                <div className="calc-result__item">
                    <div className="calc-result__value">{volume.toFixed(1)}</div>
                    <div className="calc-result__label">м³ об'єм</div>
                </div>
                <div className="calc-result__item">
                    <div className="calc-result__value">{liters.toFixed(1)}</div>
                    <div className="calc-result__label">літрів потрібно</div>
                </div>
                <div className="calc-result__item">
                    <div className="calc-result__value">{canisters}</div>
                    <div className="calc-result__label">{canisters === 1 ? 'каністра' : canisters < 5 ? 'каністри' : 'каністр'} по 5 кг</div>
                </div>
            </div>

            <div className="calc-result__divider" />

            <div className="calc-result__cta">
                <Button variant="cta" size="lg" fullWidth onClick={handleAddToCart}>
                    Додати {canisters} {canisters === 1 ? 'каністру' : canisters < 5 ? 'каністри' : 'каністр'} у кошик
                </Button>
            </div>

            <p className="calc-result__trust">
                <span>✓ Оплата при отриманні</span>
                <span>✓ Доставка по Україні</span>
            </p>
        </div>
    );
}

export default CalculatorResult;
