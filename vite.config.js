import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/static/',
  publicDir: 'frontend/public',
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    outDir: 'frontend/dist',
  },
  esbuild: {
    legalComments: 'none',
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
})
