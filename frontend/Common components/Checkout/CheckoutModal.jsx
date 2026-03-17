import { useState, useEffect } from 'react';
import { useCart } from '../../Stores/CartContext';
import { api } from '../../Api/api';
import Button from '../Button/Button';
import './CheckoutModal.css';

function CheckoutModal() {
    const {
        checkoutStep,
        setCheckoutStep,
        quoteId,
        completeOrder,
        resetCheckout,
        items,
        getTotal
    } = useCart();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '+380',
        paymentMethod: 'cod'
    });

    const [delivery, setDelivery] = useState({
        type: 'nova_poshta',
        cityQuery: '',
        cityRef: '',
        cityName: '',
        warehouseQuery: '',
        warehouseRef: '',
        warehouseName: '',
        courierCity: 'Київ',
        courierStreet: '',
        courierHouse: '',
        courierEntrance: '',
        courierApartment: ''
    });

    const [cities, setCities] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [isSearchingCities, setIsSearchingCities] = useState(false);
    const [isSearchingWarehouses, setIsSearchingWarehouses] = useState(false);
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const [showWarehouseDropdown, setShowWarehouseDropdown] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (delivery.type === 'pickup') {
            setFormData(prev => ({ ...prev, paymentMethod: 'online' }));
        } else if (delivery.type === 'courier') {
            setFormData(prev => ({ ...prev, paymentMethod: 'cod' }));
        }
    }, [delivery.type]);

    // Debounced city search
    useEffect(() => {
        if (delivery.cityQuery.length < 2) {
            setCities([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearchingCities(true);
            try {
                const res = await api.searchNPCities(delivery.cityQuery);
                setCities(res.cities || []);
            } catch (err) {
                console.error('NP City search error:', err);
            } finally {
                setIsSearchingCities(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [delivery.cityQuery]);

    // Fetch warehouses when city is selected
    useEffect(() => {
        if (!delivery.cityRef) {
            setWarehouses([]);
            return;
        }

        const fetchWarehouses = async () => {
            setIsSearchingWarehouses(true);
            try {
                const res = await api.getNPWarehouses(delivery.cityRef, delivery.warehouseQuery);
                setWarehouses(res.warehouses || []);
            } catch (err) {
                console.error('NP Warehouse search error:', err);
            } finally {
                setIsSearchingWarehouses(false);
            }
        };

        const timer = setTimeout(fetchWarehouses, 400);
        return () => clearTimeout(timer);
    }, [delivery.cityRef, delivery.warehouseQuery]);

    // Body scroll lock
    useEffect(() => {
        if (checkoutStep === 'checkout') {
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        };
    }, [checkoutStep]);

    if (checkoutStep !== 'checkout') return null;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCitySelect = (city) => {
        setDelivery(prev => ({
            ...prev,
            cityQuery: city.Present,
            cityRef: city.DeliveryCity,
            cityName: city.MainDescription,
            warehouseQuery: '',
            warehouseRef: '',
            warehouseName: ''
        }));
        setCities([]);
        setShowCityDropdown(false);
    };

    const handleWarehouseSelect = (wh) => {
        setDelivery(prev => ({
            ...prev,
            warehouseQuery: wh.Description,
            warehouseRef: wh.Ref,
            warehouseName: wh.Description
        }));
        setWarehouses([]);
        setShowWarehouseDropdown(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const cleanPhone = formData.phone.replace(/[\s\-\(\)]/g, '');
        const phoneRegex = /^(\+?380|0)\d{9}$/;
        if (!phoneRegex.test(cleanPhone)) {
            setError('Введіть коректний номер телефону (+380XXXXXXXXX або 0XXXXXXXXX)');
            return;
        }
        if (delivery.type === 'nova_poshta' && (!delivery.cityRef || !delivery.warehouseRef)) {
            setError('Оберіть місто та відділення Нової Пошти зі списку');
            return;
        }
        if (delivery.type === 'courier' && (!delivery.courierCity || !delivery.courierStreet || !delivery.courierHouse)) {
            setError('Будь ласка, заповніть всі обов\'язкові поля адреси для кур\'єра');
            return;
        }

        setIsSubmitting(true);
        try {
            const idempotencyKey = typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            
            const deliveryPayload = delivery.type === 'pickup' 
                ? { type: 'pickup' }
                : delivery.type === 'courier'
                ? {
                    type: 'courier',
                    city: delivery.courierCity,
                    street: delivery.courierStreet,
                    house: delivery.courierHouse,
                    entrance: delivery.courierEntrance || undefined,
                    apartment: delivery.courierApartment || undefined
                }
                : {
                    type: 'nova_poshta',
                    cityRef: delivery.cityRef,
                    cityName: delivery.cityName,
                    warehouseRef: delivery.warehouseRef,
                    warehouseName: delivery.warehouseName
                };

            const orderData = {
                quoteId,
                customer: {
                    firstName: formData.firstName.trim(),
                    lastName: formData.lastName.trim(),
                    phone: formData.phone
                },
                delivery: deliveryPayload,
                paymentMethod: formData.paymentMethod
            };

            const res = await api.checkout(orderData, idempotencyKey);

            // For COD, we just show success
            // For online, backend returns paymentUrl or data/signature, handling depends on LiqPay integration
            // For now, simulate success for both
            completeOrder({ ...res, status: 'success' });

        } catch (err) {
            console.error('Checkout error:', err);
            setError(err.message || 'Помилка при оформленні замовлення');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="checkout-overlay" onClick={resetCheckout}>
            <div className="checkout-modal" onClick={e => e.stopPropagation()}>
                <div className="checkout-modal__header">
                    <h3 className="checkout-modal__title">Оформлення замовлення</h3>
                    <button className="checkout-modal__close" onClick={resetCheckout} aria-label="Закрити">✕</button>
                </div>

                <div className="checkout-modal__content">
                    <div className="checkout-modal__summary">
                        {items.map(item => (
                            <div key={item.id} className="checkout-modal__summary-item">
                                <span>{item.quantity} × {item.name}</span>
                                <span>{item.price * item.quantity} ₴</span>
                            </div>
                        ))}
                        <div className="checkout-modal__summary-total">
                            <strong>До сплати:</strong>
                            <strong>{getTotal()} ₴</strong>
                        </div>
                    </div>

                    <form className="checkout-modal__form" onSubmit={handleSubmit}>
                        {error && <div className="checkout-modal__error">{error}</div>}

                        <div className="checkout-form__section">
                            <h4>Контактні дані</h4>
                            <div className="checkout-form__row">
                                <input
                                    className="checkout-form__input"
                                    type="text"
                                    name="firstName"
                                    placeholder="Ім'я"
                                    required
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                />
                                <input
                                    className="checkout-form__input"
                                    type="text"
                                    name="lastName"
                                    placeholder="Прізвище"
                                    required
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <input
                                className="checkout-form__input"
                                type="tel"
                                name="phone"
                                placeholder="+380991234567"
                                required
                                value={formData.phone}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="checkout-form__section">
                            <h4>Спосіб доставки</h4>
                            <div className="checkout-form__radio-group checkout-form__radio-group--delivery">
                                <label className="checkout-form__radio">
                                    <input type="radio" name="deliveryType" value="nova_poshta" checked={delivery.type === 'nova_poshta'} onChange={() => setDelivery(d => ({ ...d, type: 'nova_poshta' }))} />
                                    <span>Нова Пошта</span>
                                </label>
                                <label className="checkout-form__radio">
                                    <input type="radio" name="deliveryType" value="courier" checked={delivery.type === 'courier'} onChange={() => setDelivery(d => ({ ...d, type: 'courier' }))} />
                                    <span>Кур'єр по Києву</span>
                                </label>
                                <label className="checkout-form__radio">
                                    <input type="radio" name="deliveryType" value="pickup" checked={delivery.type === 'pickup'} onChange={() => setDelivery(d => ({ ...d, type: 'pickup' }))} />
                                    <span>Самовивіз</span>
                                </label>
                            </div>

                            {delivery.type === 'nova_poshta' && (
                                <div className="checkout-form__delivery-fields">
                                    <div className="checkout-form__field">
                                        <input
                                            className="checkout-form__input"
                                            type="text"
                                            placeholder="Введіть місто..."
                                            value={delivery.cityQuery}
                                            onChange={e => {
                                                setDelivery(d => ({ ...d, cityQuery: e.target.value, cityRef: e.target.value === d.cityName ? d.cityRef : '' }));
                                                setShowCityDropdown(true);
                                            }}
                                            onFocus={() => setShowCityDropdown(true)}
                                            onBlur={() => setTimeout(() => setShowCityDropdown(false), 200)}
                                        />
                                        {isSearchingCities && showCityDropdown && <span className="checkout-form__loader">Шукаємо...</span>}
                                        {showCityDropdown && cities.length > 0 && (
                                            <ul className="checkout-form__dropdown">
                                                {cities.map(c => (
                                                    <li key={c.DeliveryCity} onClick={() => handleCitySelect(c)}>
                                                        {c.Present}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>

                                    <div className="checkout-form__field">
                                        <input
                                            className="checkout-form__input"
                                            type="text"
                                            placeholder="Відділення або поштомат..."
                                            value={delivery.warehouseQuery}
                                            onChange={e => {
                                                setDelivery(d => ({ ...d, warehouseQuery: e.target.value, warehouseRef: e.target.value === d.warehouseName ? d.warehouseRef : '' }));
                                                setShowWarehouseDropdown(true);
                                            }}
                                            onFocus={() => setShowWarehouseDropdown(true)}
                                            onBlur={() => setTimeout(() => setShowWarehouseDropdown(false), 200)}
                                            disabled={!delivery.cityRef}
                                        />
                                        {isSearchingWarehouses && showWarehouseDropdown && <span className="checkout-form__loader">Шукаємо...</span>}
                                        {showWarehouseDropdown && warehouses.length > 0 && (
                                            <ul className="checkout-form__dropdown">
                                                {warehouses.map(w => (
                                                    <li key={w.Ref} onClick={() => handleWarehouseSelect(w)}>
                                                        {w.Description}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            )}

                            {delivery.type === 'courier' && (
                                <div className="checkout-form__delivery-fields">
                                    <div className="checkout-form__row">
                                        <input className="checkout-form__input" type="text" placeholder="Місто (Київ)" value={delivery.courierCity} onChange={e => setDelivery(d => ({ ...d, courierCity: e.target.value }))} required />
                                    </div>
                                    <div className="checkout-form__row">
                                        <input className="checkout-form__input" type="text" placeholder="Вулиця" value={delivery.courierStreet} onChange={e => setDelivery(d => ({ ...d, courierStreet: e.target.value }))} required />
                                    </div>
                                    <div className="checkout-form__row">
                                        <input className="checkout-form__input checkout-form__input--group" type="text" placeholder="Будинок" value={delivery.courierHouse} onChange={e => setDelivery(d => ({ ...d, courierHouse: e.target.value }))} required />
                                        <input className="checkout-form__input checkout-form__input--group" type="text" placeholder="Під'їзд" value={delivery.courierEntrance} onChange={e => setDelivery(d => ({ ...d, courierEntrance: e.target.value }))} />
                                        <input className="checkout-form__input checkout-form__input--group" type="text" placeholder="Квартира" value={delivery.courierApartment} onChange={e => setDelivery(d => ({ ...d, courierApartment: e.target.value }))} />
                                    </div>
                                </div>
                            )}

                            {delivery.type === 'pickup' && (
                                <div className="checkout-form__delivery-info">
                                    <p>Самовивіз зі складу. Детальні інструкції та точна адреса будуть надіслані після оплати.</p>
                                </div>
                            )}
                        </div>

                        <div className="checkout-form__section">
                            <h4>Оплата</h4>
                            <div className="checkout-form__radio-group">
                                <label className={`checkout-form__radio ${delivery.type === 'pickup' ? 'checkout-form__radio--disabled' : ''}`}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="cod"
                                        checked={formData.paymentMethod === 'cod'}
                                        onChange={handleInputChange}
                                        disabled={delivery.type === 'pickup'}
                                    />
                                    <span>Післяплата (при отриманні) {delivery.type === 'courier' && '(тільки готівкою)'}</span>
                                </label>
                                <label className={`checkout-form__radio ${delivery.type === 'courier' ? 'checkout-form__radio--disabled' : ''}`}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="online"
                                        checked={formData.paymentMethod === 'online'}
                                        onChange={handleInputChange}
                                        disabled={delivery.type === 'courier'}
                                    />
                                    <span>Онлайн картою (LiqPay)</span>
                                </label>
                            </div>
                            {delivery.type === 'courier' && <p className="checkout-form__hint">Для кур'єрської доставки можлива лише оплата готівкою при отриманні.</p>}
                            {delivery.type === 'pickup' && <p className="checkout-form__hint">Для самовивозу можлива лише онлайн оплата.</p>}
                        </div>

                        <Button type="submit" variant="cta" size="lg" fullWidth disabled={isSubmitting}>
                            {isSubmitting ? 'Обробка...' : 'Підтвердити замовлення'}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default CheckoutModal;
