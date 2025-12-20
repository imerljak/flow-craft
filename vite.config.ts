import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import webExtension from 'vite-plugin-web-extension';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    webExtension({
      printSummary: true,

      htmlViteConfig: {
        build: {
          rollupOptions: {
            output: {
              format: "es",
            }
          }
        }
      },

      scriptViteConfig: {
        build: {
          rollupOptions: {
            output: {
              format: "es",
            }
          }
        }
      }
    }),
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
});
