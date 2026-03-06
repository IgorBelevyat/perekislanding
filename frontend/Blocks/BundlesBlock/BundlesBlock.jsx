import SectionWrapper from '../../Common components/SectionWrapper/SectionWrapper';
import Button from '../../Common components/Button/Button';
import './BundlesBlock.css';

/*
 * Placeholder data — prices & product IDs will be fetched from RetailCRM later.
 * Each bundle contains a list of products that sum up to the total price.
 */
const bundles = [
    {
        tier: 'Мінімальний',
        tag: null,
        description: 'Базовий набір для невеликого басейну до 15 м³',
        products: [
            { name: 'Перекис водню 50%, 5 л', qty: 1, price: 420 },
            { name: 'Тест-смужки для перекису', qty: 1, price: 180 },
        ],
        color: 'minimal',
    },
    {
        tier: 'Оптимальний',
        tag: 'Найпопулярніший',
        description: 'Повний комплект для басейну 15–40 м³ на весь сезон',
        products: [
            { name: 'Перекис водню 50%, 20 л', qty: 1, price: 1350 },
            { name: 'Тест-смужки для перекису', qty: 2, price: 180 },
            { name: 'Альгіцид проти водоростей, 1 л', qty: 1, price: 290 },
        ],
        color: 'optimal',
    },
    {
        tier: 'Максимальний',
        tag: 'Для професіоналів',
        description: 'Професійний набір для великих басейнів від 40 м³',
        products: [
            { name: 'Перекис водню 50%, 20 л', qty: 2, price: 1350 },
            { name: 'Тест-смужки для перекису', qty: 3, price: 180 },
            { name: 'Альгіцид проти водоростей, 1 л', qty: 2, price: 290 },
            { name: 'pH-регулятор, 1 кг', qty: 1, price: 350 },
        ],
        color: 'maximum',
    },
];

function BundlesBlock() {
    return (
        <SectionWrapper bg="light" id="bundles">
            <h2 className="bundles__title">Набори</h2>
            <p className="bundles__subtitle">Готові комплекти для обробки басейну — все необхідне в одному замовленні</p>

            <div className="bundles__grid">
                {bundles.map((bundle, i) => {
                    const total = bundle.products.reduce((sum, p) => sum + p.price * p.qty, 0);

                    return (
                        <div key={i} className={`bundle-card bundle-card--${bundle.color}`}>
                            {bundle.tag && <span className="bundle-card__tag">{bundle.tag}</span>}

                            <h3 className="bundle-card__tier">{bundle.tier}</h3>
                            <p className="bundle-card__desc">{bundle.description}</p>

                            <ul className="bundle-card__products">
                                {bundle.products.map((product, j) => (
                                    <li key={j} className="bundle-card__product">
                                        <span className="bundle-card__product-name">
                                            {product.qty > 1 ? `${product.qty} × ` : ''}{product.name}
                                        </span>
                                        <span className="bundle-card__product-price">{product.price * product.qty} ₴</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="bundle-card__footer">
                                <div className="bundle-card__total">
                                    <span className="bundle-card__total-label">Разом:</span>
                                    <span className="bundle-card__total-price">{total} ₴</span>
                                </div>
                                <Button variant={bundle.color === 'optimal' ? 'cta' : 'primary'} size="md" fullWidth>
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
