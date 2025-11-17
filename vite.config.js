// [ryoma-tkg/djtimekeeper/DJTIMEKEEPER-phase3-dev/vite.config.js]
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.config/
export default defineConfig({
  plugins: [react()],
  base: '/', // ★ 修正: '/DJTIMEKEEPER/' から '/' に変更
  server: {
    host: true,
  },
})