import { useState } from 'react';
import Button from '../../Common components/Button/Button';
import { useCart } from '../../Stores/CartContext';
import { api } from '../../Api/api';
import { useBundles, getBundleById } from '../../Hooks/useBundles';

function CalculatorResult({ volume, liters, canisters, kValue }) {
    const { addToCart } = useCart();
    const { bundles, isLoading: bundlesLoading } = useBundles();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const optimal = getBundleById(bundles, 'optimal');
    const nasezon = getBundleById(bundles, 'nasezon');
    const pro = getBundleById(bundles, 'pro');

    // Base peroxide price from any bundle that has peroxide
    const basePrice = optimal?.customItems?.[0]?.basePrice ?? 599;

    // ── Helpers ──────────────────────────────────────
    const canisterWord = (n) =>
        n === 1 ? 'каністру' : n < 5 ? 'каністри' : 'каністр';

    const canisterWordNom = (n) =>
        n === 1 ? 'каністра' : n < 5 ? 'каністри' : 'каністр';

    const handleBuyCanistersRaw = async (qty) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.getQuote({
                customItems: [{ offerId: optimal?.customItems?.[0]?.offerId, qty, isBundleItem: false }]
            });
            if (res.items?.length > 0) {
                const item = res.items[0];
                addToCart({ id: item.offerId, name: item.name, price: item.unitPrice, basePrice: item.basePrice }, item.qty);
            }
        } catch (err) {
            console.error('Failed to get quote:', err);
            setError('Не вдалося додати до кошика.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBuyBundle = (bundle) => {
        bundle.customItems.forEach((cItem) => {
            addToCart(
                { id: cItem.offerId, name: cItem.name, price: cItem.price, basePrice: cItem.basePrice },
                cItem.qty,
                { bundleId: bundle.id }
            );
        });
    };

    // ── Upsell card ─────────────────────────────────
    const renderUpsellCard = (bundle, ctaText, highlight = false) => {
        if (!bundle) return null;
        const peroxideItem = bundle.customItems?.find(i => i.offerId === optimal?.customItems?.[0]?.offerId);
        const peroxideQty = peroxideItem?.qty ?? 0;
        const extras = bundle.customItems?.filter(i => i.offerId !== optimal?.customItems?.[0]?.offerId) || [];
        const extrasText = extras.map(e => e.name.toLowerCase()).join(' + ');
        const contentsText = `${peroxideQty} ${canisterWordNom(peroxideQty)}${extrasText ? ' + ' + extrasText : ''}`;

        return (
            <div className={`calc-upsell${highlight ? ' calc-upsell--highlight' : ''}`}>
                <div className="calc-upsell__body">
                    <div className="calc-upsell__info">
                        <span className="calc-upsell__title">{bundle.title}</span>
                        <span className="calc-upsell__contents">{contentsText}</span>
                    </div>
                    <div className="calc-upsell__pricing">
                        <span className="calc-upsell__price">{bundle.price} ₴</span>
                        {bundle.benefit > 0 && (
                            <span className="calc-upsell__benefit">Вигода {bundle.benefit} ₴</span>
                        )}
                    </div>
                </div>
                <Button
                    variant={highlight ? 'cta' : 'primary'}
                    size="md"
                    fullWidth
                    onClick={() => handleBuyBundle(bundle)}
                    disabled={isLoading}
                >
                    {ctaText}
                </Button>
            </div>
        );
    };

    // ── Determine which bundles to suggest ───────────
    const getUpsells = () => {
        if (bundlesLoading || !optimal) return [];

        const upsells = [];

        if (canisters <= 1) {
            upsells.push({ bundle: optimal, cta: 'Взяти Оптимальний вибір', highlight: false });
        } else if (canisters === 2) {
            upsells.push({ bundle: optimal, cta: 'Взяти Оптимальний вибір', highlight: false });
            upsells.push({ bundle: nasezon, cta: 'Взяти пакет На сезон', highlight: false });
        } else if (canisters === 3) {
            upsells.push({ bundle: nasezon, cta: 'Взяти пакет На сезон', highlight: true });
            upsells.push({ bundle: pro, cta: 'Взяти PRO запас', highlight: false });
        } else if (canisters === 4) {
            upsells.push({ bundle: nasezon, cta: 'Взяти пакет На сезон', highlight: true });
            upsells.push({ bundle: pro, cta: 'Взяти PRO запас', highlight: false });
        } else if (canisters === 5) {
            upsells.push({ bundle: pro, cta: 'Взяти PRO запас', highlight: true });
        } else if (canisters >= 6) {
            upsells.push({ bundle: pro, cta: 'Купити PRO пакет', highlight: true });
        }

        return upsells.filter(u => u.bundle);
    };

    const upsells = getUpsells();
    const rawPrice = basePrice * canisters;

    return (
        <div className="calc-result">
            <div className="calc-result__row">
                <div className="calc-result__item">
                    <div className="calc-result__value">{volume.toFixed(1)}</div>
                    <div className="calc-result__label">м³ об'єм</div>
                </div>
                <div className="calc-result__item">
                    <div className="calc-result__value">{canisters}</div>
                    <div className="calc-result__label">{canisterWordNom(canisters)} по 5 кг</div>
                </div>
            </div>

            <div className="calc-result__divider" />

            {error && <div className="calc-result__error">{error}</div>}

            <div className="calc-result__scenarios">
                {/* Always show "buy N canisters" option */}
                <div className="calc-result__primary-action">
                    <Button variant="cta" size="lg" fullWidth onClick={() => handleBuyCanistersRaw(canisters)} disabled={isLoading}>
                        {isLoading ? 'Завантаження...' : `Купити ${canisters} ${canisterWord(canisters)} — ${rawPrice} ₴`}
                    </Button>
                </div>

                {/* Upsell bundles */}
                {upsells.length > 0 && (
                    <div className="calc-result__or-divider">
                        <span>або оберіть набір</span>
                    </div>
                )}
                {upsells.map((u, i) => (
                    <div key={i}>
                        {renderUpsellCard(u.bundle, u.cta, u.highlight)}
                    </div>
                ))}

                {/* For ≥6 scenario, add extra canisters button */}
                {canisters > 6 && (
                    <div className="calc-result__extra">
                        <div className="calc-result__or-divider">
                            <span>потрібно більше?</span>
                        </div>
                        <Button variant="primary" size="md" fullWidth onClick={() => handleBuyCanistersRaw(canisters - 6)} disabled={isLoading}>
                            {`Додати ще ${canisters - 6} ${canisterWord(canisters - 6)} — ${basePrice * (canisters - 6)} ₴`}
                        </Button>
                    </div>
                )}
            </div>

            <p className="calc-result__trust">
                <span>✓ Можна змінити кількість у кошику</span>
                <span>✓ Доставка по Україні</span>
            </p>
        </div>
    );
}

export default CalculatorResult;
