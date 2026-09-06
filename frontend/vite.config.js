import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Frontend calls a relative /api/* path; Vite proxies it to the
      // Express backend during development so there's one less env var
      // to keep in sync. In production, serve the frontend behind
      // whatever host also proxies /api to the backend (see README).
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
