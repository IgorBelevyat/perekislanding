import React from 'react';
import Button from '../Button/Button';

function PriceAlertModal({ message, onClose }) {
    if (!message) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(0, 59, 92, 0.4)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000,
                padding: '1rem'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: '#fff',
                    borderRadius: '16px',
                    maxWidth: '400px',
                    width: '100%',
                    padding: '2.5rem 2rem',
                    textAlign: 'center',
                    boxShadow: '0 10px 25px rgba(0, 59, 92, 0.1)',
                    animation: 'fadeIn 0.2s ease-out'
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ width: '56px', height: '56px', background: '#ffebee', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 9V14M12 17.5V18M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" stroke="#d32f2f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>

                <h3 style={{ fontSize: '1.25rem', color: '#003B5C', marginBottom: '1rem', fontWeight: '700' }}>
                    Увага!
                </h3>

                <p style={{ color: '#5A7E92', marginBottom: '2rem', lineHeight: '1.5' }}>
                    {message}
                </p>

                <Button variant="outline" size="lg" fullWidth onClick={onClose}>
                    Зрозуміло
                </Button>
            </div>
        </div>
    );
}

export default PriceAlertModal;
