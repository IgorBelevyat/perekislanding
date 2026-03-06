import Button from '../../Common components/Button/Button';
import './FinalCtaBlock.css';

function FinalCtaBlock() {
    return (
        <section className="final-cta" id="final-cta">
            <div className="final-cta__inner">
                <h2 className="final-cta__title">
                    Готові до <span className="final-cta__accent">чистої води</span>?
                </h2>
                <p className="final-cta__text">
                    Розрахуйте дозування або замовте перекис 50% прямо зараз.
                    Доставка по всій Україні.
                </p>
                <div className="final-cta__buttons">
                    <Button variant="primary" size="lg" onClick={() => document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' })}>
                        Розрахувати дозування
                    </Button>
                    <Button variant="cta" size="lg" onClick={() => document.getElementById('product')?.scrollIntoView({ behavior: 'smooth' })}>
                        Купити зараз
                    </Button>
                </div>
            </div>
        </section>
    );
}

export default FinalCtaBlock;
