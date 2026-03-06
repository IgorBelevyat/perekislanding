import './Button.css';

function Button({ children, variant = 'primary', size = 'md', fullWidth = false, onClick, className = '', ...props }) {
    const baseClass = 'btn';
    const variantClass = `btn--${variant}`;
    const sizeClass = `btn--${size}`;
    const widthClass = fullWidth ? 'btn--full' : '';

    return (
        <button
            className={`${baseClass} ${variantClass} ${sizeClass} ${widthClass} ${className}`}
            onClick={onClick}
            {...props}
        >
            {children}
        </button>
    );
}

export default Button;
