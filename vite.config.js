import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './vitest.setup.js'
  },
  server: {
    port: 5177, // Dev server port (changed to avoid conflicts)
    strictPort: false, // Allow Vite to find next available port
    hmr: {
      protocol: 'ws',
      host: 'localhost'
      // Let Vite auto-detect the correct HMR port
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  }
})
