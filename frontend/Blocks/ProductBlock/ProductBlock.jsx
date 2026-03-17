import { useState, useEffect } from 'react';
import SectionWrapper from '../../Common components/SectionWrapper/SectionWrapper';
import Button from '../../Common components/Button/Button';
import { useCart } from '../../Stores/CartContext';
import { api } from '../../Api/api';
import productImg from '../../Src/assets/images/product-canister.png';
import './ProductBlock.css';

const DEFAULT_PRODUCT = {
    id: 'peroxide-5l', // Match the mock externalId
    name: 'Перекис водню 50%, 5 л',
    price: 420, // Fallback price
    oldPrice: 550,
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
                    // Find the 5L peroxide
                    const p5l = data.products.find(p => p.id === 'peroxide-5l');
                    if (p5l) {
                        setProduct(prev => ({
                            ...prev,
                            name: p5l.name,
                            price: p5l.price,
                            imageUrl: p5l.imageUrl,
                            // Old price could be calculated or fetched if supported, 
                            // for now we just keep the hardcoded one or remove it if not needed
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
                                {product.oldPrice && (
                                    <span className="product__old-price">{product.oldPrice} грн</span>
                                )}
                            </>
                        )}
                    </div>

                    <ul className="product__features">
                        <li>✓ Концентрація 50% — максимальна ефективність</li>
                        <li>✓ Зручна каністра з клапаном</li>
                        <li>✓ Вітчизняне виробництво</li>
                        <li>✓ Термін придатності — 12 місяців</li>
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
                        Оплата при отриманні · Доставка Новою Поштою · Повернення 14 днів
                    </p>
                </div>
            </div>
        </SectionWrapper>
    );
}

export default ProductBlock;
