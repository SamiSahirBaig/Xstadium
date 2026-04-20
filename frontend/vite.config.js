import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Xstadium — Sentient Stadium OS',
        short_name: 'Xstadium',
        description: 'AI-powered stadium experience — real-time crowd intel, smart routing, and VIP perks.',
        theme_color: '#0a0f1e',
        background_color: '#050b18',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
        categories: ['sports', 'entertainment', 'navigation'],
        shortcuts: [
          {
            name: 'Live Map',
            url: '/map',
            description: 'View live crowd heatmap',
          },
          {
            name: 'AI Assistant',
            url: '/assistant',
            description: 'Chat with your stadium AI guide',
          },
        ],
      },
      workbox: {
        // Cache app shell (HTML, CSS, JS) — cache-first
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // Venue layout data — stale while revalidate
            urlPattern: /\/api\/zones/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'zones-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5, // 5 minutes
              },
            },
          },
          {
            // Google Fonts — cache first
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          {
            // Google Maps JS — network first
            urlPattern: /^https:\/\/maps\.googleapis\.com/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'gmaps-cache',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  server: {
    port: parseInt(process.env.VITE_PORT) || 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true,
      },
    },
  },
  build: {
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor splitting for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'ui-vendor': ['framer-motion', 'lucide-react'],
          'query-vendor': ['@tanstack/react-query'],
        },
      },
    },
  },
});
