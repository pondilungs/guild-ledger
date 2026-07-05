import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@game-lab/engine': path.resolve(__dirname, '../../packages/engine/index.ts'),
    },
  },
});