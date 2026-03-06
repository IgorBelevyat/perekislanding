function ReviewCard({ name, city, text, rating }) {
    return (
        <div className="review-card">
            <div className="review-card__stars">
                {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} className={`review-card__star ${i < rating ? 'review-card__star--filled' : ''}`}>★</span>
                ))}
            </div>
            <p className="review-card__text">"{text}"</p>
            <div className="review-card__author">
                <div className="review-card__avatar">{name[0]}</div>
                <div>
                    <p className="review-card__name">{name}</p>
                    <p className="review-card__city">{city}</p>
                </div>
            </div>
        </div>
    );
}

export default ReviewCard;
