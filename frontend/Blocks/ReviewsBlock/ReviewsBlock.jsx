import { useState, useRef, useEffect } from 'react';
import SectionWrapper from '../../Common components/SectionWrapper/SectionWrapper';
import ReviewCard from './ReviewCard';
import './ReviewsBlock.css';

const reviews = [
    {
        name: 'Надія Л.',
        city: 'Сквира',
        text: 'Товар якісний, відправка швидко, замовляю не  в першій раз. Я задоволена.',
        rating: 5,
    },
    {
        name: 'Світлана С.',
        city: 'Суми',
        text: 'Заказую другий раз. Задоволення від товару та роботи продавця. Дякую',
        rating: 5,
    },
    {
        name: 'Олексій С.',
        city: 'Хутори',
        text: 'Чесний, порядний продавець! Блискавичний зв\'язок, швидка доставка. Приємно працювати, без жодних проблем. Рекомендую ВСІМ! Вдалих Вам продажів!',
        rating: 5,
    },
    {
        name: 'Аріна А.',
        city: 'Вінниця',
        text: 'Дуже швидко відправили. Товар гарно запакований, дуже гарна ціна і якість на вищому рівні!!!',
        rating: 5,
    },
    {
        name: 'Наталя П.',
        city: 'Київ',
        text: 'Калькулятор дуже зручний, одразу зрозуміло скільки потрібно заливати! Це реально працює, басейн ідеально чистий.',
        rating: 5,
    },
];

function ReviewsBlock() {
    const scrollRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScroll = () => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 50);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 50);
    };

    useEffect(() => {
        // Check on mount after layout
        requestAnimationFrame(checkScroll);
    }, []);

    const scroll = (direction) => {
        const el = scrollRef.current;
        if (!el) return;
        const amount = 320;
        el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    };

    return (
        <SectionWrapper bg="white" id="reviews">
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
