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
        // ★★★ 元の定義に戻すっす！ ★★★
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
        // ★★★ ここまで ★★★
        spinner: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      },
      animation: {
        // ★★★ ここの秒数を変えるっす！ ★★★
        'fade-in-up': 'fadeInUp 0.1s ease-out forwards', // 1.0s → 0.5s とかにするとクイックになるっす
        'fade-out-down': 'fadeOutDown 0.1s ease-out forwards', // 0.5s → 0.3s とかにする

        'fade-in': 'fadeIn 2.0s ease-in-out forwards',
        'fade-out': 'fadeOut 2.0s ease-in-out forwards',
        'spinner': 'spinner 1s linear infinite',
      }
      // ▲▲▲ ここまで ▲▲▲
    },
  },
  plugins: [],
}