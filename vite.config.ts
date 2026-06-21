import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      workbox: {
        // Offline app shell: navigations fall back to the cached index.html (brief §9 / §12).
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,woff2,svg,png,webmanifest}'],
        cleanupOutdatedCaches: true,
      },
      manifest: {
        name: 'Tally',
        short_name: 'Tally',
        description: 'Split bills and track who owes whom.',
        theme_color: '#0D0D11',
        background_color: '#0D0D11',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      devOptions: {
        // Lets us confirm the service worker registers during `npm run dev` (Phase 0 exit criteria).
        enabled: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
