// [ryoma-tkg/djtimekeeper/DJTIMEKEEPER-db4819ead3cea781e61d33b885b764c6c79391fb/tailwind.config.js]
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // 
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ▼▼▼ 【!!! 追加 !!!】 ▼▼▼
      screens: {
        'sp': '390px',
        // 既存の sm: 640px, md: 768px... は自動で維持されます
      },
      // ▲▲▲ 【!!! 追加 !!!】 ここまで ▲▲▲
      fontFamily: {
        sans: ['Montserrat', '"IBM Plex Sans JP"', 'sans-serif'],
        mono: ['Orbitron', 'Montserrat', 'sans-serif'],
      },
      colors: {
        // 
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
        },
        // ★★★ トースト用のアニメーションを追加っす！ ★★★
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
        'fade-out-down': 'fadeOutDown 0.4s ease-out forwards',
        'fade-in': 'fadeIn 2.0s ease-in-out forwards',
        'fade-out': 'fadeOut 2.0s ease-in-out forwards',
        'spinner': 'spinner 1s linear infinite',
        // ★★★ トースト用のアニメーションを追加っす！ ★★★
        'toast-in': 'toast-in 0.3s ease-out forwards',
        'toast-out': 'toast-out 0.3s ease-in forwards',
      }
    },
  },
  plugins: [],
}