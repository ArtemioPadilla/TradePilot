import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import AstroPWA from '@vite-pwa/astro';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
// Single-sourced canonical origin — see site.config.mjs for the rationale.
// astro.config.mjs cannot import site-meta.ts directly because it runs in
// Node before Vite starts (import.meta.env is unavailable here).
import { SITE_ORIGIN } from './site.config.mjs';

// Subpath the site is served under. GitHub *project* pages live at
// `<domain>/<repo>/`, so the Pages build sets ASTRO_BASE=/inceptor
// (see .github/workflows/deploy.yml). Local dev + root deploys leave it unset →
// base '/'. The trailing slash is normalized by Astro.
const BASE = process.env.ASTRO_BASE || '/';
// Public-asset prefix that respects BASE (BASE already ends without a trailing
// slash unless it's '/'). Used for the PWA manifest icon paths below.
const asset = (p) => `${BASE.replace(/\/$/, '')}/${p.replace(/^\//, '')}`;

export default defineConfig({
  // Production origin — single-sourced from site.config.mjs.
  // artemiop.com is the custom domain configured on the GitHub Pages account;
  // this project repo is served at https://artemiop.com/inceptor/.
  site: SITE_ORIGIN,
  base: BASE,
  // i18n routing — English at root (no prefix), Spanish under /es/.
  // `prefixDefaultLocale: false` keeps existing English URLs unchanged.
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
  },
  integrations: [
    // MDX for the /docs/* content collection — lets pages embed React components
    mdx(),
    sitemap({
      // Don't bloat the sitemap with test artifacts or generated content
      filter: (page) =>
        !page.includes('/_') && !page.includes('/404') && !page.endsWith('.json'),
    }),
    react(),
    AstroPWA({
      registerType: 'autoUpdate',
      strategies: 'generateSW',
      includeAssets: [
        'favicon.svg',
        'favicon.ico',
        'apple-touch-icon.png',
        'icons/pwa-192.png',
        'icons/pwa-512.png',
        'icons/pwa-maskable-512.png',
        'icons/logo-source.svg',
      ],
      manifest: {
        name: 'TradePilot',
        short_name: 'TradePilot',
        description:
          'Backtest trading strategies in your browser — portfolio optimization, Backtest Lab, leaderboards.',
        theme_color: '#2563eb',
        background_color: '#0a0a0a',
        display: 'standalone',
        start_url: BASE,
        scope: BASE,
        icons: [
          { src: asset('icons/pwa-192.png'), sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: asset('icons/pwa-512.png'), sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: asset('icons/pwa-maskable-512.png'),
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          { src: asset('icons/logo-source.svg'), sizes: 'any', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        // Precache all static assets produced by the Astro build
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webp,woff2}'],
        // Fall back to index for any navigation that doesn't match a static file
        navigateFallback: BASE,
        // Never fall back for API routes — they must not serve the SPA shell
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // GitHub REST API — stale-while-revalidate so the dashboard works offline
            urlPattern: /^https:\/\/api\.github\.com\/.*$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'github-api',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      experimental: {
        // Ensures that directory URLs (e.g. /showcase/) are handled correctly
        // by the SW without 404-ing on trailing-slash variants
        directoryAndTrailingSlashHandler: true,
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  output: 'static',
});
