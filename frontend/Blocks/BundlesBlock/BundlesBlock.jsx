import { useState, useEffect } from 'react';
import SectionWrapper from '../../Common components/SectionWrapper/SectionWrapper';
import Button from '../../Common components/Button/Button';
import { api } from '../../Api/api';
import './BundlesBlock.css';

const INITIAL_BUNDLES = [
    {
        tier: 'Мінімальний',
        tag: null,
        description: 'Базовий набір для невеликого басейну до 15 м³',
        items: [
            { offerId: 'peroxide-5l', name: 'Перекис водню 50%, 5 л', qty: 1, basePrice: 420 },
            { offerId: 'test-strips', name: 'Тест-смужки для перекису', qty: 1, basePrice: 180 },
        ],
        color: 'minimal',
    },
    {
        tier: 'Оптимальний',
        tag: 'Найпопулярніший',
        description: 'Повний комплект для басейну 15–40 м³ на весь сезон',
        items: [
            { offerId: 'peroxide-20l', name: 'Перекис водню 50%, 20 л', qty: 1, basePrice: 1350 },
            { offerId: 'test-strips', name: 'Тест-смужки для перекису', qty: 2, basePrice: 180 },
            { offerId: 'algicide-1l', name: 'Альгіцид проти водоростей, 1 л', qty: 1, basePrice: 290 },
        ],
        color: 'optimal',
    },
    {
        tier: 'Максимальний',
        tag: 'Для професіоналів',
        description: 'Професійний набір для великих басейнів від 40 м³',
        items: [
            { offerId: 'peroxide-20l', name: 'Перекис водню 50%, 20 л', qty: 2, basePrice: 1350 },
            { offerId: 'test-strips', name: 'Тест-смужки для перекису', qty: 3, basePrice: 180 },
            { offerId: 'algicide-1l', name: 'Альгіцид проти водоростей, 1 л', qty: 2, basePrice: 290 },
            { offerId: 'ph-regulator-1kg', name: 'pH-регулятор, 1 кг', qty: 1, basePrice: 350 },
        ],
        color: 'maximum',
    },
];

function BundlesBlock() {
    const [bundles, setBundles] = useState(INITIAL_BUNDLES);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        api.getProducts()
            .then(data => {
                if (!isMounted || !data.products) return;

                // Create a map from the backend response
                const offerMap = {};
                data.products.forEach(p => {
                    offerMap[p.id] = {
                        price: p.price,
                        imageUrl: p.imageUrl
                    };
                });

                // Update bundles with real prices and images
                setBundles(prevBundles =>
                    prevBundles.map(bundle => ({
                        ...bundle,
                        items: bundle.items.map(item => {
                            const offerData = offerMap[item.offerId] || {};
                            return {
                                ...item,
                                // Fallback to basePrice if the offer wasn't found in CRM
                                price: offerData.price || item.basePrice,
                                imageUrl: offerData.imageUrl || null,
                            };
                        })
                    }))
                );
            })
            .catch(err => console.error('Failed to fetch bundle prices:', err))
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        return () => { isMounted = false; };
    }, []);

    return (
        <SectionWrapper bg="light" id="bundles">
            <h2 className="bundles__title">Набори</h2>
            <p className="bundles__subtitle">Готові комплекти для обробки басейну — все необхідне в одному замовленні</p>

            <div className="bundles__grid">
                {bundles.map((bundle, i) => {
                    // Use updated price if available, otherwise basePrice
                    const total = bundle.items.reduce((sum, item) => sum + (item.price || item.basePrice) * item.qty, 0);

                    return (
                        <div key={i} className={`bundle-card bundle-card--${bundle.color}`}>
                            {bundle.tag && <span className="bundle-card__tag">{bundle.tag}</span>}

                            <h3 className="bundle-card__tier">{bundle.tier}</h3>
                            <p className="bundle-card__desc">{bundle.description}</p>

                            <ul className="bundle-card__products">
                                {bundle.items.map((item, j) => (
                                    <li key={j} className="bundle-card__product">
                                        <div className="bundle-card__product-info">
                                            {item.imageUrl && (
                                                <img
                                                    src={item.imageUrl}
                                                    alt={item.name}
                                                    className="bundle-card__product-thumb"
                                                />
                                            )}
                                            <span className="bundle-card__product-name">
                                                {item.qty > 1 ? `${item.qty} × ` : ''}{item.name}
                                            </span>
                                        </div>
                                        <span className="bundle-card__product-price">
                                            {isLoading ? '...' : (item.price || item.basePrice) * item.qty} ₴
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <div className="bundle-card__footer">
                                <div className="bundle-card__total">
                                    <span className="bundle-card__total-label">Разом:</span>
                                    <span className="bundle-card__total-price">{isLoading ? '...' : total} ₴</span>
                                </div>
                                <Button variant={bundle.color === 'optimal' ? 'cta' : 'primary'} size="md" fullWidth disabled={isLoading}>
                                    Замовити набір
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </SectionWrapper>
    );
}

export default BundlesBlock;
