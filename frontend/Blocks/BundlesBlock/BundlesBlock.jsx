import { useState, useEffect } from 'react';
import SectionWrapper from '../../Common components/SectionWrapper/SectionWrapper';
import Button from '../../Common components/Button/Button';
import { api } from '../../Api/api';
import { useCart } from '../../Stores/CartContext';
import './BundlesBlock.css';

function BundlesBlock() {
    const [bundles, setBundles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { addToCart, clearCart } = useCart();

    useEffect(() => {
        let isMounted = true;
        api.getBundles()
            .then(data => {
                if (!isMounted || !data.bundles) return;
                setBundles(data.bundles);
            })
            .catch(err => console.error('Failed to fetch bundles:', err))
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        return () => { isMounted = false; };
    }, []);

    const handleOrderBundle = (bundle) => {
        // We now allow multiple distinct bundles to coexist in the cart
        bundle.customItems.forEach((cItem) => {
            addToCart(
                {
                    id: cItem.offerId,
                    name: cItem.name,
                    price: cItem.price,
                    basePrice: cItem.basePrice,
                },
                cItem.qty,
                {
                    bundleId: bundle.id
                }
            );
        });
    };

    return (
        <SectionWrapper bg="light" id="bundles">
            <h2 className="bundles__title">Набори</h2>
            <p className="bundles__subtitle">Готові комплекти для обробки басейну — все необхідне в одному замовленні</p>

            <div className="bundles__grid">
                {bundles.map((bundle, i) => (
                    <div key={i} className={`bundle-card bundle-card--${bundle.type}`}>
                        {bundle.isPopular && (
                            <span className="bundle-card__tag">Найпопулярніший</span>
                        )}

                        <h3 className="bundle-card__tier">{bundle.title}</h3>
                        <p className="bundle-card__desc">{bundle.subtitle}</p>

                        <ul className="bundle-card__products">
                            {bundle.customItems.map((item, j) => (
                                <li key={j} className="bundle-card__product">
                                    <div className="bundle-card__product-info">
                                        <span className="bundle-card__product-name">
                                            {item.qty} × {item.name}
                                        </span>
                                    </div>
                                    <span className="bundle-card__product-price">
                                        {item.price === 0 ? 'У подарунок' : `${item.price * item.qty} ₴`}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        <div className="bundle-card__footer">
                            <div className="bundle-card__total">
                                <span className="bundle-card__total-label">Разом:</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {bundle.benefit > 0 && (
                                        <span className="bundle-card__benefit-inline">
                                            Вигода: {bundle.benefit} ₴
                                        </span>
                                    )}
                                    <span className="bundle-card__total-price">{bundle.price} ₴</span>
                                </div>
                            </div>
                            <Button
                                variant={bundle.isPopular ? 'cta' : 'primary'}
                                size="md"
                                fullWidth
                                disabled={isLoading}
                                onClick={() => handleOrderBundle(bundle)}
                            >
                                Замовити набір
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </SectionWrapper>
    );
}

export default BundlesBlock;
