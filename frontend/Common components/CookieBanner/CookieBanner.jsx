import React, { useState, useEffect } from 'react';
import cookieImg from '../../Src/assets/images/cookie.png';

import Button from '../Button/Button';

function CookieBanner() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookie_consent');
        if (!consent) {
            setIsVisible(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookie_consent', 'granted');
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('consent', 'update', {
                'ad_storage': 'granted',
                'analytics_storage': 'granted'
            });
        }
        setIsVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem('cookie_consent', 'denied');
        // Consent remains default 'denied'
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 md:bottom-8 left-0 w-full px-4 md:px-6 z-[999] pointer-events-none">
            <div className="w-full max-w-[1200px] mx-auto bg-white rounded-xl shadow-none sm:shadow-card-hover border border-border p-4 sm:p-5 md:p-6 transition-transform pointer-events-auto">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 md:gap-8">
                    
                    {/* Text and Image Content */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-1 sm:gap-4 md:gap-6 text-center sm:text-left flex-1">
                        <img 
                            src={cookieImg} 
                            alt="Cookies" 
                            className="w-32 h-32 sm:w-36 sm:h-36 shrink-0 object-contain block mx-auto sm:mx-0 -my-4 sm:my-0" 
                        />
                        <div className="flex flex-col justify-center h-full pt-1">
                            <h3 className="text-secondary font-bold text-xl mb-2">
                                Ми використовуємо cookies
                            </h3>
                            <p className="text-text-secondary text-sm md:text-base leading-relaxed">
                                Цей сайт використовує файли cookie для аналітики та покращення вашого користувацького досвіду. 
                                Продовжуючи перегляд, ви погоджуєтеся на їх використання відповідно до нашої політики.
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0 mt-2 md:mt-0">
                        <Button 
                            variant="outline"
                            size="md"
                            onClick={handleDecline}
                        >
                            Відхилити
                        </Button>
                        <Button 
                            variant="cta"
                            size="md"
                            onClick={handleAccept}
                        >
                            Прийняти
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CookieBanner;
