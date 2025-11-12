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
        // ★★★ ここから修正っす ★★★
        simpleFadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        simpleFadeOut: {
          '0%': { opacity: '1', visibility: 'visible' },
          '100%': { opacity: '0', visibility: 'hidden' }, // 最後は消す
        },
        // ★★★ ここまで修正っす ★★★

        // 古い定義はコメントアウトか削除（一応残しとくっす）
        // fadeIn: {
        //   'from': { opacity: '0' },
        //   'to': { opacity: '1' },
        // },
        // fadeOut: {
        //   'from': { opacity: '1', visibility: 'visible' },
        //   'to': { opacity: '0', /* visibility: 'hidden' <--- ★★★ こっちも消しとくっす！ ★★★ */ },
        // },

        spinner: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      },
      animation: {
        // ★★★ ここを修正っす ★★★
        'simple-fade-in': 'simpleFadeIn 0.5s ease-out forwards', // 0.5秒
        'simple-fade-out': 'simpleFadeOut 0.5s ease-out forwards', // 0.5秒

        // 古い定義
        // 'fade-in-up': 'fadeInUp 1.0s ease-out forwards', 
        // 'fade-out-down': 'fadeOutDown 0.5s ease-out forwards',
        'fade-in': 'fadeIn 2.0s ease-in-out forwards',
        'fade-out': 'fadeOut 2.0s ease-in-out forwards',
        'spinner': 'spinner 1s linear infinite',
      }
      // ▲▲▲ ここまで ▲▲▲
    },
  },
  plugins: [],
}