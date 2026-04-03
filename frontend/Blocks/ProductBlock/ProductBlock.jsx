import { useState, useEffect } from 'react';
import SectionWrapper from '../../Common components/SectionWrapper/SectionWrapper';
import Button from '../../Common components/Button/Button';
import { useCart } from '../../Stores/CartContext';
import { api } from '../../Api/api';
import { getStockStatus } from '../../Helpers/availabilityHelper';
import productImg from '../../Src/assets/images/product-canister.png';
import './ProductBlock.css';

const IconCheckSmall = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0096B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '3px', marginRight: '8px' }}>
        <circle cx="12" cy="12" r="12" fill="rgba(0, 150, 184, 0.15)" stroke="none" />
        <polyline points="7 12 10.5 15.5 17 8.5" />
    </svg>
);

const DEFAULT_PRODUCT = {
    id: 'peroxide-5l',
    name: 'Перекис водню 50%, 5 л',
    price: 420, // Fallback price
    inStock: true,
    availability: '',
};

function ProductBlock() {
    const [quantity, setQuantity] = useState(1);
    const [product, setProduct] = useState(DEFAULT_PRODUCT);
    const [isLoading, setIsLoading] = useState(true);
    const { addToCart } = useCart();

    useEffect(() => {
        let isMounted = true;
        api.getProducts()
            .then(data => {
                if (isMounted && data.products) {
                    // Find the main peroxide product (flagged by the backend via OFFER_ID_PEROXIDE .env)
                    const p5l = data.products.find(p => p.isMainProduct);
                    if (p5l) {
                        setProduct(prev => ({
                            ...prev,
                            id: p5l.id,       // Real CRM offer ID for correct cart/checkout
                            name: p5l.name,
                            price: p5l.price,
                            imageUrl: p5l.imageUrl,
                            inStock: p5l.inStock ?? true,
                            availability: p5l.availability ?? '',
                        }));
                    }
                }
            })
            .catch(err => console.error('Failed to fetch products for ProductBlock:', err))
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        return () => { isMounted = false; };
    }, []);

    const handleAdd = () => {
        addToCart(product, quantity);
    };

    return (
        <SectionWrapper bg="white" id="product">
            <h2 className="product__section-title">Замовити перекис 50%</h2>
            <div className="product__card">
                <div className="product__image-col">
                    <span className="product__badge">Найпопулярніший</span>
                    <img
                        src={product.imageUrl || productImg}
                        alt={product.name}
                        className="product__image"
                    />
                </div>

                <div className="product__info-col">
                    <h3 className="product__name">{isLoading ? 'Завантаження...' : product.name}</h3>

                    <div className="product__price-row">
                        {isLoading ? (
                            <span className="product__price">Завантаження...</span>
                        ) : (
                            <>
                                <span className="product__price">{product.price} грн</span>
                                {(() => {
                                    const status = getStockStatus(product.availability, product.inStock);
                                    return (
                                        <span className={`product__stock-badge product__stock-badge--${status.variant}`}>
                                            {status.text}
                                        </span>
                                    );
                                })()}
                            </>
                        )}
                    </div>

                    <ul className="product__features" style={{ listStyle: 'none', paddingLeft: 0 }}>
                        <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '8px' }}><IconCheckSmall /> <span>Концентрація 50% — максимальна ефективність</span></li>
                        <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '8px' }}><IconCheckSmall /> <span>Зручна каністра з клапаном</span></li>
                        <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '8px' }}><IconCheckSmall /> <span>Вітчизняне виробництво</span></li>
                        <li style={{ display: 'flex', alignItems: 'flex-start' }}><IconCheckSmall /> <span>Термін придатності — 12 місяців</span></li>
                    </ul>

                    <div className="product__quantity">
                        <button className="product__qty-btn" onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={isLoading}>−</button>
                        <span className="product__qty-value">{quantity}</span>
                        <button className="product__qty-btn" onClick={() => setQuantity(q => q + 1)} disabled={isLoading}>+</button>
                    </div>

                    <div className="product__total">
                        Разом: <strong>{product.price * quantity} грн</strong>
                    </div>

                    <Button variant="cta" size="lg" fullWidth onClick={handleAdd} disabled={isLoading}>
                        Додати в кошик
                    </Button>

                    <p className="product__trust">
                        Оплата при отриманні · Доставка Новою Поштою · Повернення 14 днів · <a href="#certificates" style={{ color: 'inherit', textDecoration: 'underline', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#0096B8'} onMouseLeave={(e) => e.target.style.color = 'inherit'}>Сертифікати якості</a>
                    </p>
                </div>
            </div>
        </SectionWrapper>
    );
}

export default ProductBlock;
