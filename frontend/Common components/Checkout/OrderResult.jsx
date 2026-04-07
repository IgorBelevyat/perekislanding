import { useCart } from '../../Stores/CartContext';
import Button from '../Button/Button';
import './CheckoutModal.css';

function OrderResult() {
    const { checkoutStep, orderResult, resetCheckout } = useCart();

    if (checkoutStep !== 'success' && checkoutStep !== 'failed' && checkoutStep !== 'processing') return null;

    if (checkoutStep === 'processing') {
        const isPaymentCheck = new URLSearchParams(window.location.search).has('orderId');
        return (
            <div
                className="checkout-overlay"
                style={{ alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
            >
                <div
                    className="checkout-modal"
                    style={{
                        height: 'auto',
                        margin: 'auto',
                        borderRadius: '16px',
                        maxWidth: '450px',
                        animation: 'fadeIn 0.3s ease-out'
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="checkout-modal__content" style={{ textAlign: 'center', padding: '2.5rem' }}>
                        <div style={{ width: '48px', height: '48px', margin: '0 auto 1.5rem', border: '4px solid #e0e0e0', borderTopColor: '#FF8C00', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--color-text)', fontWeight: '700' }}>
                            {isPaymentCheck ? 'Перевіряємо оплату...' : 'Формуємо замовлення...'}
                        </h2>
                        <p style={{ color: 'var(--color-text-light)', lineHeight: '1.6' }}>Зачекайте, будь ласка</p>
                    </div>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const isSuccess = checkoutStep === 'success';

    return (
        <div
            className="checkout-overlay"
            onClick={isSuccess ? resetCheckout : null}
            style={{ alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
        >
            <div
                className="checkout-modal"
                style={{
                    height: 'auto',
                    margin: 'auto',
                    borderRadius: '16px',
                    maxWidth: '450px',
                    animation: 'fadeIn 0.3s ease-out'
                }}
                onClick={e => e.stopPropagation()}
            >
                <div className="checkout-modal__header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                    <div style={{ flex: 1 }}></div>
                    <button className="checkout-modal__close" onClick={resetCheckout} aria-label="Закрити">✕</button>
                </div>

                <div className="checkout-modal__content" style={{ textAlign: 'center', padding: '0 2.5rem 2.5rem' }}>
                    {isSuccess && orderResult?.status !== 'pending' ? (
                        <>
                            <div style={{ width: '64px', height: '64px', background: '#e6f7eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5 13L9 17L19 7" stroke="#00b050" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--color-text)', fontWeight: '700' }}>Замовлення успішно оформлено!</h2>
                            <p style={{ color: 'var(--color-text-light)', marginBottom: '2rem', lineHeight: '1.6' }}>
                                Дякуємо за покупку. Номер вашого замовлення: <br /><strong style={{ color: 'var(--color-text)' }}>{orderResult?.orderNumber || orderResult?.orderId || orderResult?.id}</strong>.<br /><br />
                                Ми зв'яжемося з вами найближчим часом для підтвердження.
                            </p>
                            <Button variant="cta" size="lg" fullWidth onClick={resetCheckout}>
                                Повернутися на сайт
                            </Button>
                        </>
                    ) : isSuccess && orderResult?.status === 'pending' ? (
                        <>
                            <div style={{ width: '64px', height: '64px', background: '#fff3e0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="10" stroke="#f57c00" strokeWidth="2" />
                                    <path d="M12 8V12L15 15" stroke="#f57c00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#f57c00', fontWeight: '700' }}>Оплата обробляється</h2>
                            <p style={{ color: 'var(--color-text-light)', marginBottom: '2rem', lineHeight: '1.6' }}>
                                Замовлення №<strong style={{ color: 'var(--color-text)' }}>{orderResult?.orderNumber || orderResult?.orderId}</strong> створено.<br /><br />
                                Статус оплати ще обробляється. Ми зв'яжемося з вами для підтвердження.
                            </p>
                            <Button variant="cta" size="lg" fullWidth onClick={resetCheckout}>
                                Повернутися на сайт
                            </Button>
                        </>
                    ) : (
                        <>
                            <div style={{ width: '64px', height: '64px', background: '#ffebee', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18 6L6 18M6 6L18 18" stroke="#d32f2f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#d32f2f', fontWeight: '700' }}>Оплата не пройшла</h2>
                            <p style={{ color: 'var(--color-text-light)', marginBottom: '2rem', lineHeight: '1.6' }}>
                                Сталася помилка під час обробки платежу. Будь ласка, спробуйте ще раз або оберіть інший спосіб оплати.
                            </p>
                            <Button variant="outline" size="lg" fullWidth onClick={resetCheckout}>
                                Повернутися до кошика
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default OrderResult;
