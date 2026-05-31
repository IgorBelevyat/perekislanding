import { useState, useEffect } from 'react';
import { useCart } from '../../Stores/CartContext';
import { api } from '../../Api/api';
import Button from '../Button/Button';
import './CheckoutModal.css';

const COURIER_CITIES = [
    'місто Київ',
    'с. Вишневе',
    'с. Петропавлівська Борщагівка',
    'с. Софіївська Борщагівка',
    'с. Чайки'
];

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
        email: '',
        companyName: '',
        edrpou: '',
        paymentMethod: 'online' // Changed default to online
    });

    const [delivery, setDelivery] = useState({
        type: 'nova_poshta',
        cityQuery: '',
        cityRef: '',
        cityName: '',
        warehouseQuery: '',
        warehouseRef: '',
        warehouseName: '',
        courierCity: COURIER_CITIES[0], // Changed initial value
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
    const [showCourierDropdown, setShowCourierDropdown] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [errors, setErrors] = useState([]);
    const [shakeFields, setShakeFields] = useState([]);
    const [safetyAgreed, setSafetyAgreed] = useState(false);

    // Update payment method based on delivery type
    useEffect(() => {
        setFormData(prev => {
            if (prev.paymentMethod === 'cashless') {
                return prev; // Cashless works for all delivery types
            }
            if (delivery.type === 'pickup' && prev.paymentMethod === 'cod') {
                return { ...prev, paymentMethod: 'online' };
            }
            if (delivery.type === 'courier' && prev.paymentMethod === 'cod') {
                // Keep COD if it was selected, since courier now supports COD
                return prev;
            }
            // For nova_poshta, COD or online are both fine
            return prev;
        });
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
        if (errors.includes(name)) {
            setErrors(prev => prev.filter(err => err !== name));
        }
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
        if (errors.includes('cityQuery')) {
            setErrors(prev => prev.filter(err => err !== 'cityQuery'));
        }
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
        if (errors.includes('warehouseQuery')) {
            setErrors(prev => prev.filter(err => err !== 'warehouseQuery'));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const newErrors = [];

        if (!formData.firstName.trim()) newErrors.push('firstName');
        if (!formData.lastName.trim()) newErrors.push('lastName');

        const cleanPhone = formData.phone.replace(/[\s\-\(\)]/g, '');
        const phoneRegex = /^(\+?380|0)\d{9}$/;
        if (!phoneRegex.test(cleanPhone)) newErrors.push('phone');

        if (delivery.type === 'nova_poshta') {
            if (!delivery.cityRef) newErrors.push('cityQuery');
            if (!delivery.warehouseRef) newErrors.push('warehouseQuery');
        } else if (delivery.type === 'courier') {
            if (!delivery.courierStreet.trim()) newErrors.push('courierStreet');
            if (!delivery.courierHouse.trim()) newErrors.push('courierHouse');
        }

        if (formData.paymentMethod === 'cashless') {
            if (!formData.companyName.trim()) newErrors.push('companyName');
            if (!formData.edrpou.trim()) newErrors.push('edrpou');
        }

        if (!safetyAgreed) newErrors.push('safetyAgreed');

        if (newErrors.length > 0) {
            setErrors(newErrors);
            setShakeFields(newErrors);
            setTimeout(() => setShakeFields([]), 500);

            setTimeout(() => {
                const firstErrorElement = document.querySelector('.checkout-form__input--error, .checkout-form__checkbox-custom--error');
                if (firstErrorElement) {
                    firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 50);

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

            // Get or create persistent customer ID for CRM deduplication
            let customerExternalId = localStorage.getItem('hlorka_customer_id');
            if (!customerExternalId) {
                customerExternalId = typeof crypto !== 'undefined' && crypto.randomUUID
                    ? crypto.randomUUID()
                    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                        return v.toString(16);
                    });
                localStorage.setItem('hlorka_customer_id', customerExternalId);
            }

            let data = {
                quoteId,
                customerExternalId,
                customer: {
                    firstName: formData.firstName.trim(),
                    lastName: formData.lastName.trim(),
                    phone: formData.phone.replace(/\D/g, ''),
                    email: formData.email || undefined,
                    companyName: formData.companyName || undefined,
                    edrpou: formData.edrpou || undefined,
                },
                delivery: deliveryPayload,
                paymentMethod: formData.paymentMethod,
            };

            const res = await api.checkout(data, idempotencyKey);

            if (res.payment?.paymentUrl) {
                // Redirect user to LiqPay payment page
                // We don't call completeOrder here, because they haven't paid yet. 
                // We rely on the redirect back to ?orderId=... to confirm.
                window.location.href = res.payment.paymentUrl;
                return;
            }

            // For COD or Cashless, we just show success immediately
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
                                <span style={{ whiteSpace: 'nowrap' }}>
                                    {item.isGift ? `${item.price * item.quantity} ₴ (у подарунок)` : `${item.price * item.quantity} ₴`}
                                </span>
                            </div>
                        ))}
                        <div className="checkout-modal__summary-total">
                            <strong>До сплати:</strong>
                            <strong style={{ whiteSpace: 'nowrap' }}>{getTotal()} ₴</strong>
                        </div>
                    </div>

                    <form id="checkout-form" className="checkout-modal__form" onSubmit={handleSubmit} noValidate>
                        {error && <div className="checkout-modal__error">{error}</div>}

                        <div className="checkout-form__section">
                            <h4>Контактні дані</h4>
                            <div className="checkout-form__row">
                                <div className="checkout-form__floating-group">
                                    <input
                                        className={`checkout-form__input ${errors.includes('firstName') ? 'checkout-form__input--error' : ''} ${shakeFields.includes('firstName') ? 'shake' : ''}`}
                                        type="text"
                                        name="firstName"
                                        placeholder=" "
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                    />
                                    <label className="checkout-form__floating-label">Ім'я</label>
                                </div>
                                <div className="checkout-form__floating-group">
                                    <input
                                        className={`checkout-form__input ${errors.includes('lastName') ? 'checkout-form__input--error' : ''} ${shakeFields.includes('lastName') ? 'shake' : ''}`}
                                        type="text"
                                        name="lastName"
                                        placeholder=" "
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                    />
                                    <label className="checkout-form__floating-label">Прізвище</label>
                                </div>
                            </div>
                            <div className="checkout-form__field">
                                <div className="checkout-form__floating-group">
                                    <input
                                        className={`checkout-form__input ${errors.includes('phone') ? 'checkout-form__input--error' : ''} ${shakeFields.includes('phone') ? 'shake' : ''}`}
                                        type="tel"
                                        name="phone"
                                        placeholder="+380 XX XXX XX XX"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                    />
                                    <label className="checkout-form__floating-label">Телефон</label>
                                </div>
                                {errors.includes('phone') && (
                                    <span className="checkout-form__error-text">Введіть номер у форматі +380XXXXXXXXX або 0XXXXXXXXX</span>
                                )}
                            </div>
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
                                        <div className="checkout-form__floating-group">
                                            <input
                                                className={`checkout-form__input ${errors.includes('cityQuery') ? 'checkout-form__input--error' : ''} ${shakeFields.includes('cityQuery') ? 'shake' : ''}`}
                                                type="text"
                                                placeholder=" "
                                                value={delivery.cityQuery}
                                                onChange={e => {
                                                    setDelivery(d => ({ ...d, cityQuery: e.target.value, cityRef: e.target.value === d.cityName ? d.cityRef : '' }));
                                                    setShowCityDropdown(true);
                                                    if (errors.includes('cityQuery')) setErrors(prev => prev.filter(err => err !== 'cityQuery'));
                                                }}
                                                onFocus={() => setShowCityDropdown(true)}
                                                onBlur={() => setTimeout(() => setShowCityDropdown(false), 200)}
                                            />
                                            <label className="checkout-form__floating-label">Місто доставки</label>
                                        </div>
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
                                        <div className="checkout-form__floating-group">
                                            <input
                                                className={`checkout-form__input ${errors.includes('warehouseQuery') ? 'checkout-form__input--error' : ''} ${shakeFields.includes('warehouseQuery') ? 'shake' : ''}`}
                                                type="text"
                                                placeholder=" "
                                                value={delivery.warehouseQuery}
                                                onChange={e => {
                                                    setDelivery(d => ({ ...d, warehouseQuery: e.target.value, warehouseRef: e.target.value === d.warehouseName ? d.warehouseRef : '' }));
                                                    setShowWarehouseDropdown(true);
                                                    if (errors.includes('warehouseQuery')) setErrors(prev => prev.filter(err => err !== 'warehouseQuery'));
                                                }}
                                                onFocus={() => setShowWarehouseDropdown(true)}
                                                onBlur={() => setTimeout(() => setShowWarehouseDropdown(false), 200)}
                                                disabled={!delivery.cityRef}
                                            />
                                            <label className="checkout-form__floating-label">Відділення</label>
                                        </div>
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
                                        <div className="checkout-form__field" style={{ position: 'relative', width: '100%' }}>
                                            <div
                                                className="checkout-form__input"
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    cursor: 'pointer',
                                                    background: '#fff',
                                                    userSelect: 'none'
                                                }}
                                                onClick={() => setShowCourierDropdown(!showCourierDropdown)}
                                            >
                                                <span>{delivery.courierCity}</span>
                                                <svg
                                                    width="12"
                                                    height="8"
                                                    viewBox="0 0 12 8"
                                                    fill="none"
                                                    style={{
                                                        transform: showCourierDropdown ? 'rotate(180deg)' : 'none',
                                                        transition: 'transform 0.2s ease'
                                                    }}
                                                >
                                                    <path d="M1 1.5L6 6.5L11 1.5" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                            {showCourierDropdown && (
                                                <>
                                                    <div
                                                        style={{ position: 'fixed', inset: 0, zIndex: 9 }}
                                                        onClick={() => setShowCourierDropdown(false)}
                                                    />
                                                    <ul className="checkout-form__dropdown" style={{ zIndex: 10, marginTop: '4px' }}>
                                                        {COURIER_CITIES.map(city => (
                                                            <li
                                                                key={city}
                                                                onClick={() => {
                                                                    setDelivery(d => ({ ...d, courierCity: city }));
                                                                    setShowCourierDropdown(false);
                                                                }}
                                                                style={{
                                                                    backgroundColor: delivery.courierCity === city ? 'rgba(0, 150, 255, 0.05)' : undefined,
                                                                    color: delivery.courierCity === city ? 'var(--color-primary)' : undefined,
                                                                    fontWeight: delivery.courierCity === city ? '600' : '400'
                                                                }}
                                                            >
                                                                {city}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="checkout-form__row">
                                        <div className="checkout-form__floating-group">
                                            <input className={`checkout-form__input ${errors.includes('courierStreet') ? 'checkout-form__input--error' : ''} ${shakeFields.includes('courierStreet') ? 'shake' : ''}`} type="text" placeholder=" " value={delivery.courierStreet} onChange={e => { setDelivery(d => ({ ...d, courierStreet: e.target.value })); if (errors.includes('courierStreet')) setErrors(prev => prev.filter(err => err !== 'courierStreet')); }} />
                                            <label className="checkout-form__floating-label">Вулиця</label>
                                        </div>
                                    </div>
                                    <div className="checkout-form__row">
                                        <div className="checkout-form__floating-group">
                                            <input className={`checkout-form__input checkout-form__input--group ${errors.includes('courierHouse') ? 'checkout-form__input--error' : ''} ${shakeFields.includes('courierHouse') ? 'shake' : ''}`} type="text" placeholder=" " value={delivery.courierHouse} onChange={e => { setDelivery(d => ({ ...d, courierHouse: e.target.value })); if (errors.includes('courierHouse')) setErrors(prev => prev.filter(err => err !== 'courierHouse')); }} />
                                            <label className="checkout-form__floating-label">Будинок</label>
                                        </div>
                                        <div className="checkout-form__floating-group">
                                            <input className="checkout-form__input checkout-form__input--group" type="text" placeholder=" " value={delivery.courierEntrance} onChange={e => setDelivery(d => ({ ...d, courierEntrance: e.target.value }))} />
                                            <label className="checkout-form__floating-label">Під'їзд</label>
                                        </div>
                                        <div className="checkout-form__floating-group">
                                            <input className="checkout-form__input checkout-form__input--group" type="text" placeholder=" " value={delivery.courierApartment} onChange={e => setDelivery(d => ({ ...d, courierApartment: e.target.value }))} />
                                            <label className="checkout-form__floating-label">Квартира</label>
                                        </div>
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
                                    <span>Післяплата (при отриманні)</span>
                                </label>
                                <label className="checkout-form__radio">
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="online"
                                        checked={formData.paymentMethod === 'online'}
                                        onChange={handleInputChange}
                                    />
                                    <span>Онлайн картою (LiqPay)</span>
                                </label>
                                <label className="checkout-form__radio">
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="cashless"
                                        checked={formData.paymentMethod === 'cashless'}
                                        onChange={handleInputChange}
                                    />
                                    <span>За безготівковим рахунком</span>
                                </label>
                            </div>

                            {formData.paymentMethod === 'cashless' && (
                                <div style={{ marginTop: '1rem' }}>
                                    <div className="checkout-form__row">
                                        <div className="checkout-form__floating-group">
                                            <input
                                                className={`checkout-form__input ${errors.includes('companyName') ? 'checkout-form__input--error' : ''} ${shakeFields.includes('companyName') ? 'shake' : ''}`}
                                                type="text"
                                                name="companyName"
                                                placeholder=" "
                                                value={formData.companyName}
                                                onChange={handleInputChange}
                                            />
                                            <label className="checkout-form__floating-label">Назва організації *</label>
                                        </div>
                                    </div>
                                    <div className="checkout-form__row">
                                        <div className="checkout-form__floating-group">
                                            <input
                                                className={`checkout-form__input ${errors.includes('edrpou') ? 'checkout-form__input--error' : ''} ${shakeFields.includes('edrpou') ? 'shake' : ''}`}
                                                type="text"
                                                name="edrpou"
                                                placeholder=" "
                                                value={formData.edrpou}
                                                onChange={handleInputChange}
                                            />
                                            <label className="checkout-form__floating-label">Код ЄДРПОУ *</label>
                                        </div>
                                    </div>
                                    <div className="checkout-form__delivery-info" style={{ marginTop: '0.75rem' }}>
                                        <p>Для безготівкої оплати менеджер звяжеться з вами за номером телефону.</p>
                                    </div>
                                </div>
                            )}

                            {delivery.type === 'courier' && (
                                <p className="checkout-form__hint">
                                    Оплата за кур'єрські послуги 250 гривень і можлива тільки готівкою.
                                </p>
                            )}
                            {delivery.type === 'pickup' && <p className="checkout-form__hint">Для самовивозу можлива лише онлайн або безготівкова оплата.</p>}
                        </div>

                    </form>
                </div>

                <div className="checkout-modal__footer">
                    <div className="checkout-form__agreement">
                        <label className="checkout-form__checkbox">
                            <input
                                type="checkbox"
                                checked={safetyAgreed}
                                onChange={(e) => {
                                    setSafetyAgreed(e.target.checked);
                                    if (errors.includes('safetyAgreed')) {
                                        setErrors(prev => prev.filter(err => err !== 'safetyAgreed'));
                                    }
                                }}
                            />
                            <span className={`checkout-form__checkbox-custom ${errors.includes('safetyAgreed') ? 'checkout-form__checkbox-custom--error' : ''} ${shakeFields.includes('safetyAgreed') ? 'shake' : ''}`}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </span>
                            <span className="checkout-form__checkbox-text">
                                Я ознайомився(-лась) з <a href="#safety-rules" onClick={(e) => {
                                    window.dispatchEvent(new Event('open-safety-rules'));
                                    resetCheckout();
                                }}>правилами безпечного використання</a>
                            </span>
                        </label>
                    </div>

                    <Button form="checkout-form" type="submit" variant="cta" fullWidth disabled={isSubmitting} className="checkout-modal__submit-btn">
                        {isSubmitting ? 'Обробка...' : 'Підтвердити замовлення'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default CheckoutModal;
