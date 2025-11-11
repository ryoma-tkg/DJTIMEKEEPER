/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // ← src以下のファイルも監視対象にするっす
  ],
  theme: {
    extend: {
      // ▼▼▼ index.htmlからコピペするゾーン ▼▼▼
      fontFamily: {
          sans: ['Montserrat', '"IBM Plex Sans JP"', 'sans-serif'],
          mono: ['Orbitron', 'Montserrat', 'sans-serif'],
      },
      colors: {
          'brand-primary': '#818cf8',
          'brand-secondary': '#c084fc',
          'surface-background': '#18181b', // Near-black gray (Zinc 900)
          'surface-container': '#27272a', // (Zinc 800)
          'on-surface': '#f4f4f5', // (Zinc 100)
          'on-surface-variant': '#a1a1aa', // (Zinc 400)
      },
      keyframes: {
          fadeInUp: {
              '0%': { opacity: '0', transform: 'translateY(20px)' },
              '100%': { opacity: '1', transform: 'translateY(0)' },
          },
          fadeIn: {
              'from': { opacity: '0' },
              'to': { opacity: '1' },
          },
          fadeOut: {
              'from': { opacity: '1' },
              'to': { opacity: '0' },
          },
            spinner: {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' },
          }
      },
      animation: {
          'fade-in-up': 'fadeInUp 0.7s ease-out forwards',
          'fade-in': 'fadeIn 1.5s ease-in-out forwards',
          'fade-out': 'fadeOut 1.5s ease-in-out forwards',
          'spinner': 'spinner 1s linear infinite',
      }
      // ▲▲▲ ここまで ▲▲▲
    },
  },
  plugins: [],
}