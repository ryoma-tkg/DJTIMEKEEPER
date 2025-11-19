// [tailwind.config.js]
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'sp': '390px',
      },
      fontFamily: {
        sans: ['Montserrat', '"IBM Plex Sans JP"', 'sans-serif'],
        mono: ['Orbitron', 'Montserrat', 'sans-serif'],
      },
      colors: {
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
        // ▼▼▼ 【追加】 高級感のあるモーダル出現アニメーション ▼▼▼
        modalIn: {
          '0%': { opacity: '0', transform: 'scale(0.95) translateY(10px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        // ▲▲▲ 追加ここまで ▲▲▲
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        fadeOutDown: {
          '0%': { opacity: '1', transform: 'translateY(0) translateZ(0)', visibility: 'visible' },
          '100%': { opacity: '0', transform: 'translateY(20px) translateZ(0)', visibility: 'hidden' },
        },
        fadeOut: {
          'from': { opacity: '1', visibility: 'visible' },
          'to': { opacity: '0', visibility: 'hidden' },
        },
        spinner: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'toast-in': {
          '0%': { transform: 'translateX(-50%) translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(-50%) translateY(0)', opacity: '1' },
        },
        'toast-out': {
          '0%': { transform: 'translateX(-50%) translateY(0)', opacity: '1' },
          '100%': { transform: 'translateX(-50%) translateY(-100%)', opacity: '0' },
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.4s ease-out forwards',
        // ▼▼▼ 【追加】 イージングを調整してリッチな動きに ▼▼▼
        'modal-in': 'modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        // ▲▲▲ 追加ここまで ▲▲▲
        'fade-out-down': 'fadeOutDown 0.3s ease-out forwards',

        'fade-in': 'fadeIn 0.3s ease-in-out forwards',
        'fade-out': 'fadeOut 0.3s ease-in-out forwards',

        'spinner': 'spinner 1s linear infinite',
        'toast-in': 'toast-in 0.3s ease-out forwards',
        'toast-out': 'toast-out 0.3s ease-in forwards',
      }
    },
  },
  plugins: [],
}