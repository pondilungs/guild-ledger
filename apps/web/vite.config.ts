import { defineConfig } from 'vite';
import path from 'path';

const itchBuild = process.env.VITE_ITCH_BUILD === '1';

export default defineConfig({
  base: './',
  build: itchBuild
    ? {
        rollupOptions: {
          output: {
            entryFileNames: 'assets/game.js',
            chunkFileNames: 'assets/game.js',
            assetFileNames: 'assets/game.[ext]',
          },
        },
      }
    : undefined,
  resolve: {
    alias: {
      '@game-lab/engine': path.resolve(__dirname, '../../packages/engine/index.ts'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
    },
  },
});