import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

/** Serves the local SQLite API under /api from the dev server, so `npm run dev` is the whole stack on one port. */
function localApi(): Plugin {
  return {
    name: 'pestcure-local-api',
    async configureServer(server) {
      const { apiMiddleware } = await server.ssrLoadModule('/server/devApi.ts');
      server.middlewares.use('/api', apiMiddleware());
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      localApi(),
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['pwa-maskable-192.png', 'pwa-maskable-512.png', 'avatars/*.svg', 'favicon.ico', 'favicon-48.png', 'apple-touch-icon.png', 'icon.svg', 'pestcure-logo.svg', 'pestcure-logo.png'],
        manifest: {
          id: '/',
          name: 'PestCure Operations',
          short_name: 'PestCure',
          description: 'Weekly reviews, targets and team performance for PestCure.',
          theme_color: '#1b6a43',
          background_color: '#e6f3ea',
          display: 'standalone',
          display_override: ['standalone', 'minimal-ui'],
          orientation: 'any',
          start_url: '/',
          scope: '/',
          categories: ['business', 'productivity'],
          icons: [
            { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/pwa-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
            { src: '/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          importScripts: ['push-sw.js'],
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : { ignored: ['**/server/data/**'] },
    },
  };
});
