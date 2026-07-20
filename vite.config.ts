import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const alias = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  base: '/Gargotte-Adventure/',
  root: '.',
  resolve: {
    alias: {
      '@gargotte/common': alias('./packages/common/src/index.ts'),
      '@gargotte/engine': alias('./packages/engine/src/index.ts'),
      '@gargotte/content-schema': alias('./packages/content-schema/src/index.ts'),
      '@gargotte/renderer': alias('./packages/renderer/src/index.ts'),
      '@gargotte/ui': alias('./packages/ui/src/index.ts'),
      '@gargotte/save': alias('./packages/save/src/index.ts'),
      '@gargotte/audio': alias('./packages/audio/src/index.ts')
    }
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Gargotte Adventure',
        short_name: 'Gargotte',
        description: 'Dungeon crawler de plateau coopératif, tactile et déterministe.',
        theme_color: '#1c1310',
        background_color: '#1c1310',
        display: 'standalone',
        orientation: 'landscape',
        start_url: '/Gargotte-Adventure/',
        scope: '/Gargotte-Adventure/',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,json,webp,png,woff2}'],
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html'
      }
    })
  ],
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2022'
  }
});
