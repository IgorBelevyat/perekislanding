import { useState } from 'react';
import SectionWrapper from '../../Common components/SectionWrapper/SectionWrapper';
import Button from '../../Common components/Button/Button';
import { useCart } from '../../Stores/CartContext';
import productImg from '../../Src/assets/images/product-canister.png';
import './ProductBlock.css';

const PRODUCT = {
    id: 'peroxide-50',
    name: 'Перекис водню 50%, 5 кг',
    price: 340,
    oldPrice: 420,
};

function ProductBlock() {
    const [quantity, setQuantity] = useState(1);
    const { addToCart } = useCart();

    const handleAdd = () => {
        addToCart(PRODUCT, quantity);
    };

    return (
        <SectionWrapper bg="white" id="product">
            <h2 className="product__section-title">Замовити перекис 50%</h2>
            <div className="product__card">
                <div className="product__image-col">
                    <span className="product__badge">Найпопулярніший</span>
                    <img src={productImg} alt="Каністра перекису водню 50%, 5 кг" className="product__image" />
                </div>

                <div className="product__info-col">
                    <h3 className="product__name">{PRODUCT.name}</h3>

                    <div className="product__price-row">
                        <span className="product__price">{PRODUCT.price} грн</span>
                        {PRODUCT.oldPrice && (
                            <span className="product__old-price">{PRODUCT.oldPrice} грн</span>
                        )}
                    </div>

                    <ul className="product__features">
                        <li>✓ Концентрація 50% — максимальна ефективність</li>
                        <li>✓ Зручна каністра з клапаном</li>
                        <li>✓ Вітчизняне виробництво</li>
                        <li>✓ Термін придатності — 12 місяців</li>
                    </ul>

                    <div className="product__quantity">
                        <button className="product__qty-btn" onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
                        <span className="product__qty-value">{quantity}</span>
                        <button className="product__qty-btn" onClick={() => setQuantity(q => q + 1)}>+</button>
                    </div>

                    <div className="product__total">
                        Разом: <strong>{PRODUCT.price * quantity} грн</strong>
                    </div>

                    <Button variant="cta" size="lg" fullWidth onClick={handleAdd}>
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
