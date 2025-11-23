// [ryoma-tkg/djtimekeeper/DJTIMEKEEPER-ai-chat2/vite.config.js]
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    host: true,
  },
  // ▼▼▼ 追加: 本番ビルド時に console.log を削除 ▼▼▼
  esbuild: {
    drop: ['console', 'debugger'],
  },
})