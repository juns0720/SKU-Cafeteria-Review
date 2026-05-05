import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const popupHeaders = {
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '성결 학식',
        short_name: '성결 학식',
        theme_color: '#FF6B5C',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        lang: 'ko',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/sku-cafeteria-n\.onrender\.com\/api/,
            handler: 'NetworkOnly',
          },
        ],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-google': ['@react-oauth/google'],
        },
      },
    },
  },
  server: {
    headers: popupHeaders,
  },
  preview: {
    headers: popupHeaders,
  },
})
