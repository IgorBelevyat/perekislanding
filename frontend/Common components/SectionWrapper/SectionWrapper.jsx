import './SectionWrapper.css';

function SectionWrapper({ children, bg = 'white', className = '', id = '' }) {
    return (
        <section className={`section-wrapper section-wrapper--${bg} ${className}`} id={id}>
            <div className="section-wrapper__inner">
                {children}
            </div>
        </section>
    );
}

export default SectionWrapper;
