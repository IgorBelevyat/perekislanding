import { useState, useRef } from 'react';
import SectionWrapper from '../../Common components/SectionWrapper/SectionWrapper';
import ReviewCard from './ReviewCard';
import './ReviewsBlock.css';

const reviews = [
    {
        name: 'Олександр М.',
        city: 'Київ',
        text: 'Вже другий сезон використовую перекис замість хлору. Вода прозора, без запаху. Діти можуть купатися без подразнення очей. Однозначно рекомендую!',
        rating: 5,
    },
    {
        name: 'Ірина К.',
        city: 'Одеса',
        text: 'Калькулятор дуже зручний — одразу зрозуміла, скільки потрібно замовити. Доставка Новою Поштою за 2 дні. Басейн став ідеально чистим.',
        rating: 5,
    },
    {
        name: 'Віталій П.',
        city: 'Дніпро',
        text: 'Спочатку сумнівався, але спробував шокову обробку — зелена вода стала прозорою за 36 годин. Тепер тільки перекис, ніякого хлору.',
        rating: 5,
    },
    {
        name: 'Марина С.',
        city: 'Львів',
        text: 'У нас троє дітей, тому безпека на першому місці. Перекис розкладається на воду і кисень — нічого шкідливого. Дуже задоволена!',
        rating: 5,
    },
    {
        name: 'Андрій Л.',
        city: 'Харків',
        text: 'Економія відчутна — раніше на хлор витрачав значно більше. Плюс не потрібно вимірювати pH так ретельно. Простіше і дешевше.',
        rating: 4,
    },
];

function ReviewsBlock() {
    const scrollRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = () => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 10);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
    };

    const scroll = (direction) => {
        const el = scrollRef.current;
        if (!el) return;
        const amount = 320;
        el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    };

    return (
        <SectionWrapper bg="light" id="reviews">
            <div className="reviews">
                <h2 className="reviews__title">Відгуки наших клієнтів</h2>

                <div className="reviews__controls">
                    <button className={`reviews__arrow ${!canScrollLeft ? 'reviews__arrow--disabled' : ''}`} onClick={() => scroll('left')} aria-label="Попередній">
                        ←
                    </button>
                    <button className={`reviews__arrow ${!canScrollRight ? 'reviews__arrow--disabled' : ''}`} onClick={() => scroll('right')} aria-label="Наступний">
                        →
                    </button>
                </div>

                <div className={`reviews__slider ${canScrollLeft ? 'reviews__slider--fade-left' : ''} ${canScrollRight ? 'reviews__slider--fade-right' : ''}`} ref={scrollRef} onScroll={checkScroll}>
                    {reviews.map((review, i) => (
                        <ReviewCard key={i} {...review} />
                    ))}
                </div>
            </div>
        </SectionWrapper>
    );
}

export default ReviewsBlock;
