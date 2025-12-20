import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './public/manifest.json';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@background': path.resolve(__dirname, './src/background'),
      '@popup': path.resolve(__dirname, './src/popup'),
      '@storage': path.resolve(__dirname, './src/storage'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        popup: 'index.html',
        options: 'options.html',
      },
    },
  },
});
