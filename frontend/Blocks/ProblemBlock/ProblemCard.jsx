function ProblemCard({ icon, title, text }) {
    return (
        <div className="problem-card">
            <div className="problem-card__icon">{icon}</div>
            <h3 className="problem-card__title">{title}</h3>
            <p className="problem-card__text">{text}</p>
        </div>
    );
}

export default ProblemCard;
