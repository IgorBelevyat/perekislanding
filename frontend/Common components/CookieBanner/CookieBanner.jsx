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
            <div className="w-full max-w-[1200px] mx-auto bg-white rounded-xl shadow-none sm:shadow-card-hover border border-border p-4 max-[340px]:p-3 sm:p-5 md:p-6 transition-transform pointer-events-auto">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 md:gap-8">
                    
                    {/* Text and Image Content */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-1 sm:gap-4 md:gap-6 text-left flex-1">
                        <img 
                            src={cookieImg} 
                            alt="Cookies" 
                            className="hidden sm:block w-32 h-32 sm:w-36 sm:h-36 shrink-0 object-contain mx-0" 
                        />
                        <div className="flex flex-col justify-center h-full pt-1 w-full">
                            <div className="flex items-center gap-0 mb-2">
                                <img 
                                    src={cookieImg} 
                                    alt="Cookies" 
                                    className="w-20 h-20 max-[340px]:w-14 max-[340px]:h-14 sm:hidden shrink-0 object-contain block -my-4 max-[340px]:-my-2 -ml-3 max-[340px]:-ml-2" 
                                />
                                <h3 className="text-secondary font-bold text-lg max-[340px]:text-base sm:text-xl m-0">
                                    Ми використовуємо cookies
                                </h3>
                            </div>
                            <p className="text-text-secondary text-xs max-[340px]:text-[11px] sm:text-sm md:text-base leading-relaxed text-left">
                                Цей сайт використовує файли cookie для аналітики та покращення вашого користувацького досвіду. 
                                Продовжуючи перегляд, ви погоджуєтеся на їх використання відповідно до нашої політики.
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-row gap-1 sm:gap-3 w-full md:w-auto shrink-0 mt-4 md:mt-0">
                        <div className="flex-1 md:flex-none">
                            <Button 
                                variant="outline"
                                size="md"
                                fullWidth
                                onClick={handleDecline}
                                className="max-[340px]:!px-2 max-[340px]:!py-2 max-[340px]:!text-xs"
                            >
                                Відхилити
                            </Button>
                        </div>
                        <div className="flex-1 md:flex-none">
                            <Button 
                                variant="cta"
                                size="md"
                                fullWidth
                                onClick={handleAccept}
                                className="max-[340px]:!px-2 max-[340px]:!py-2 max-[340px]:!text-xs"
                            >
                                Прийняти
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CookieBanner;
