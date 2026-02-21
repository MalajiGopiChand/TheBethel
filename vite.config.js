import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: [
      'sandie-unfired-ardith.ngrok-free.dev'
    ]
  },
  publicDir: 'public'
})
