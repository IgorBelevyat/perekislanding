import { useState } from 'react';
import Button from '../../Common components/Button/Button';
import { useCart } from '../../Stores/CartContext';
import { api } from '../../Api/api';

function CalculatorResult({ volume, liters, canisters, kValue }) {
    const { addToCart } = useCart();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAddToCart = async () => {
        setIsLoading(true);
        setError(null); // Changed from '' to null

        try {
            // Check if we have dimensions or volume from context/props
            // Assuming the parent CalculatorBlock calculates volume
            const calcInputData = { V: Number(volume.toFixed(2)) }; // Updated to use 'volume' prop and format

            const requestData = {
                bundleId: 'basic', // Using the basic bundle for 5L logic initially
                calcInput: calcInputData,
                k: kValue || 0.7, // Add kValue prop in CalculatorBlock
                includeAddons: false, // We only want the peroxide
            };

            // Request quote from the server
            const res = await api.getQuote(requestData);

            // The quote response contains items array and quoteId
            if (res.items && res.items.length > 0) {
                // Find the main peroxide item
                const peroxideItem = res.items[0];

                // Add to cart with proper ID and server pricing
                addToCart(
                    {
                        id: peroxideItem.offerId,
                        name: peroxideItem.name,
                        price: peroxideItem.unitPrice
                    },
                    peroxideItem.qty,
                    res.quoteId // Pass quoteId to cart if cart context supports it
                );
            }
        } catch (err) {
            console.error('Failed to get quote:', err);
            setError('Не вдалося додати до кошика. Спробуйте ще раз.');
        } finally {
            setIsLoading(false);
        }
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

            {error && <div style={{ color: 'red', marginBottom: '10px', textAlign: 'center' }}>{error}</div>}

            <div className="calc-result__cta">
                <Button variant="cta" size="lg" fullWidth onClick={handleAddToCart} disabled={isLoading}>
                    {isLoading ? 'Завантаження...' : `Додати ${canisters} ${canisters === 1 ? 'каністру' : canisters < 5 ? 'каністри' : 'каністр'} у кошик`}
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
