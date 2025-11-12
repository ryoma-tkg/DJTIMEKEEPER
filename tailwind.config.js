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
            visibility: 'visible' /* アニメ開始時は見えるように */
          },
          '100%': {
            opacity: '0',
            transform: 'translateY(20px) translateZ(0)',
            /* visibility: 'hidden'  <--- ★★★ この行を削除かコメントアウト！ ★★★ */
          },
        },
        fadeOut: {
          'from': { opacity: '1', visibility: 'visible' },
          'to': { opacity: '0', /* visibility: 'hidden' <--- ★★★ こっちも消しとくっす！ ★★★ */ },
        },
        spinner: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      },
      animation: {
        'fade-in-up': 'fadeInUp 1.0s ease-out forwards', // 0.7s から 1.0s に延長
        'fade-out-down': 'fadeOutDown 0.5s ease-out forwards', /* 消えるのは早く 0.5s*/
        'fade-in': 'fadeIn 2.0s ease-in-out forwards',
        'fade-out': 'fadeOut 2.0s ease-in-out forwards',
        'spinner': 'spinner 1s linear infinite',
      }
      // ▲▲▲ ここまで ▲▲▲
    },
  },
  plugins: [],
}