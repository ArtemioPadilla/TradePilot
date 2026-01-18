// @ts-check
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'url';
import path from 'path';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Bundle analysis - only enable when ANALYZE=true
const analyze = process.env.ANALYZE === 'true';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],

  vite: {
    plugins: [
      tailwindcss(),
      // Bundle visualizer - generates stats.html when ANALYZE=true
      analyze && (await import('rollup-plugin-visualizer')).visualizer({
        filename: './stats.html',
        open: true,
        gzipSize: true,
        brotliSize: true,
        template: 'treemap', // or 'sunburst', 'network'
      }),
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@layouts': path.resolve(__dirname, './src/layouts'),
        '@lib': path.resolve(__dirname, './src/lib'),
        '@stores': path.resolve(__dirname, './src/stores'),
        '@styles': path.resolve(__dirname, './src/styles'),
        '@assets': path.resolve(__dirname, './src/assets'),
      },
    },
    build: {
      // Enable source maps for better debugging
      sourcemap: process.env.NODE_ENV === 'development',
      // Chunk splitting for better caching
      rollupOptions: {
        output: {
          manualChunks: {
            // Split vendor chunks for better caching
            'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            'react-vendor': ['react', 'react-dom'],
          },
        },
      },
    },
  },

  // Output configuration for static hosting (GitHub Pages)
  output: 'static',
  build: {
    assets: '_assets',
  },
});