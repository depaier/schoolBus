import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      '.ngrok-free.app',
      '.ngrok.io',
      'localhost',
      '127.0.0.1'
    ],
    allowHmrAccessFrom: [
      'http://localhost:8000',
      'http://127.0.0.1:8000',
      'http://127.0.0.1:5173',
      'http://localhost:5173',
      'http://localhost:4040',
    ],
  },
})
