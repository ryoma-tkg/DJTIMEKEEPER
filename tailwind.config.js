/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // ライトモード切り替えに必須っす！
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Montserrat', '"IBM Plex Sans JP"', 'sans-serif'],
        mono: ['Orbitron', 'Montserrat', 'sans-serif'],
      },
      colors: {
        // index.css の変数 (RGB数値) を rgb() で囲んで使うっす
        'brand-primary': 'rgb(var(--color-brand-primary) / <alpha-value>)',
        'brand-secondary': 'rgb(var(--color-brand-secondary) / <alpha-value>)',
        'surface-background': 'rgb(var(--color-surface-background) / <alpha-value>)',
        'surface-container': 'rgb(var(--color-surface-container) / <alpha-value>)',
        'on-surface': 'rgb(var(--color-on-surface) / <alpha-value>)',
        'on-surface-variant': 'rgb(var(--color-on-surface-variant) / <alpha-value>)',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px) translateZ(0)' },
          '100%': { opacity: '1', transform: 'translateY(0) translateZ(0)' },
        },
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        fadeOutDown: {
          '0%': {
            opacity: '1',
            transform: 'translateY(0) translateZ(0)',
            visibility: 'visible'
          },
          '100%': {
            opacity: '0',
            transform: 'translateY(20px) translateZ(0)',
            visibility: 'hidden'
          },
        },
        fadeOut: {
          'from': { opacity: '1', visibility: 'visible' },
          'to': {
            opacity: '0', visibility: 'hidden',
          },
        },
        spinner: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.4s ease-out forwards',
        'fade-out-down': 'fadeOutDown 0.4s ease-out forwards',
        'fade-in': 'fadeIn 2.0s ease-in-out forwards',
        'fade-out': 'fadeOut 2.0s ease-in-out forwards',
        'spinner': 'spinner 1s linear infinite',
      }
    },
  },
  plugins: [],
}