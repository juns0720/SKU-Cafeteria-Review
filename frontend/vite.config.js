import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const popupHeaders = {
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: popupHeaders,
  },
  preview: {
    headers: popupHeaders,
  },
})
