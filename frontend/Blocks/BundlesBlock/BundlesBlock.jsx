import SectionWrapper from '../../Common components/SectionWrapper/SectionWrapper';
import Button from '../../Common components/Button/Button';
import { useCart } from '../../Stores/CartContext';
import { useBundles } from '../../Hooks/useBundles';
import './BundlesBlock.css';
import nasezonImg from '../../Src/assets/images/nasezon.png';
import optimalImg from '../../Src/assets/images/optimal.png';
import prozapasImg from '../../Src/assets/images/prozapas.png';

const BUNDLE_IMAGES = {
    'minimal': nasezonImg, // На сезон
    'optimal': optimalImg, // Оптимальний вибір
    'maximum': prozapasImg, // PRO запас
};

function BundlesBlock() {
    const {
        bundles,
        peroxideInStock,
        pricesConsistent,
        isLoading,
    } = useBundles();
    const { addToCart } = useCart();

    const handleOrderBundle = (bundle) => {
        if (!pricesConsistent) return; // Block if prices inconsistent

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
                    bundleId: bundle.id,
                    minQty: cItem.name.includes('Перекис') ? cItem.qty : undefined
                }
            );
        });
    };

    return (
        <SectionWrapper bg="light" id="bundles">
            <h2 className="bundles__title">Набори</h2>
            <p className="bundles__subtitle">Готові комплекти для обробки басейну — все необхідне в одному замовленні</p>

            {/* Price sync maintenance banner */}
            {!pricesConsistent && (
                <div className="bundles__maintenance-banner">
                    <span className="bundles__maintenance-icon">⚙️</span>
                    <span>Відбуваються технічні роботи. Можливість оформлювати замовлення скоро повернеться!</span>
                </div>
            )}

            <div className="bundles__grid">
                {bundles.map((bundle, i) => (
                    <div key={i} className={`bundle-card bundle-card--${bundle.type}`}>
                        <div className="bundle-card__silhouettes">
                            <img src={BUNDLE_IMAGES[bundle.type]} alt="" className="bundle-card__bg-img" />
                        </div>

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
                                        {item.isGift ? `У подарунок (${item.price}₴)` : `${item.price * item.qty} ₴`}
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
                                disabled={isLoading || !pricesConsistent}
                                onClick={() => handleOrderBundle(bundle)}
                            >
                                {pricesConsistent ? 'Замовити набір' : 'Тимчасово недоступно'}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </SectionWrapper>
    );
}

export default BundlesBlock;
