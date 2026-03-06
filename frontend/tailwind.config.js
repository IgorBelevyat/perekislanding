/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './index.html',
        './Src/**/*.{js,jsx}',
        './Blocks/**/*.{js,jsx}',
        './Common components/**/*.{js,jsx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#0096B8',
                    dark: '#007A96',
                    light: '#E0F4F9',
                },
                secondary: {
                    DEFAULT: '#003B5C',
                },
                'light-bg': '#F4FAFC',
                cta: {
                    DEFAULT: '#FF7A00',
                    dark: '#E56D00',
                },
                'text-main': '#1E1E1E',
                'text-secondary': '#6B7280',
                border: '#E5E7EB',
                success: '#10B981',
                error: '#EF4444',
            },
            fontFamily: {
                sans: ['Montserrat', 'Inter', 'system-ui', 'sans-serif'],
            },
            fontSize: {
                'h1-desktop': ['clamp(2.5rem, 4vw, 3.25rem)', { lineHeight: '1.15', fontWeight: '700' }],
                'h1-mobile': ['1.75rem', { lineHeight: '1.2', fontWeight: '700' }],
                'h2-desktop': ['clamp(2rem, 3vw, 2.25rem)', { lineHeight: '1.2', fontWeight: '600' }],
                'h2-mobile': ['1.375rem', { lineHeight: '1.25', fontWeight: '600' }],
            },
            borderRadius: {
                sm: '8px',
                md: '12px',
                lg: '16px',
            },
            boxShadow: {
                card: '0 8px 24px rgba(0, 0, 0, 0.08)',
                'card-hover': '0 12px 32px rgba(0, 0, 0, 0.12)',
                'input-focus': '0 0 0 3px rgba(0, 150, 184, 0.2)',
            },
            keyframes: {
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideDown: {
                    '0%': { opacity: '0', maxHeight: '0' },
                    '100%': { opacity: '1', maxHeight: '500px' },
                },
            },
            animation: {
                'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
                'slide-down': 'slideDown 0.3s ease-out forwards',
            },
        },
    },
    plugins: [],
};
