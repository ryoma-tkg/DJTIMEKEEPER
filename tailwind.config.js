/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ... (fontFamily, colors は変更なし) ...
      keyframes: {
        fadeInUp: {
          /* ★★★ 修正っす！ opacity を削除！ transform だけにする ★★★ */
          '0%': { transform: 'translateY(20px) translateZ(0)' },
          '100%': { transform: 'translateY(0) translateZ(0)' },
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
          },
        },
        fadeOut: {
          'from': { opacity: '1', visibility: 'visible' },
          'to': { opacity: '0', },
        },
        spinner: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      },
      animation: {
        /* ★★★ 修正っす！ duration を 1.0s から 0.5s に変更 ★★★ */
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'fade-out-down': 'fadeOutDown 0.5s ease-out forwards',
        'fade-in': 'fadeIn 2.0s ease-in-out forwards',
        'fade-out': 'fadeOut 2.0s ease-in-out forwards',
        'spinner': 'spinner 1s linear infinite',
      }
    },
  },
  plugins: [],
}