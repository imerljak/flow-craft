
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    // Equivalent to Jest's testEnvironment: 'jsdom'
    environment: 'jsdom',

    // Jest's roots: ['<rootDir>/src'] -> limit to src
    // In Vitest, prefer include pattern(s)
    include: [
      'src/**/__tests__/**/*.ts?(x)',
      'src/**/?(*.)+(spec|test).ts?(x)',
    ],

    // Setup files run after the test environment is ready
    // Jest: setupFilesAfterEnv -> Vitest: setupFiles
    setupFiles: [path.resolve(__dirname, 'src/setupTests.ts')],

    // Suppress expected error logs from console
    onConsoleLog(log, type) {
      // Suppress intentional invalid regex error from ruleEngine test
      if (type === 'stderr' && log.includes('Invalid regex pattern')) {
        return false;
      }
      return true;
    },

    // Coverage settings (Vitest uses c8/istanbul under the hood)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      // Equivalent to collectCoverageFrom include
      include: ['src/**/*.{ts,tsx}'],

      // Equivalent to collectCoverageFrom exclusions
      exclude: [
        'src/**/*.d.ts',
        'src/**/__tests__/**',
        'src/setupTests.ts',
        'src/popup/App.tsx',      // covered by E2E
        'src/popup/index.tsx',
        'src/options/App.tsx',    // covered by E2E
        'src/options/index.tsx',
        'src/background/index.ts',// MV3 service worker
        'src/**/index.ts',        // barrel files
      ],

      // Equivalent to coverageThreshold.global
      thresholds: {
        branches: 70,
        functions: 70,
        lines: 75,
        statements: 75,
      },
    },

    // Vitest automatically compiles TS/TSX via esbuild, so no transform block needed.
    // If you rely on JSX runtime: ensure tsconfig has "jsx": "react-jsx" (as you had in ts-jest).
    // You can also force it here, but usually tsconfig is enough.

    // Jest's moduleNameMapper -> use Vite resolve.alias for path aliases
    // CSS stubbing noted below
  },

  // Path aliases (Jest's moduleNameMapper)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@background': path.resolve(__dirname, 'src/background'),
      '@popup': path.resolve(__dirname, 'src/popup'),
      '@storage': path.resolve(__dirname, 'src/storage'),
    },
  },

  // Optional: if you import CSS directly in tests, Vite will parse it.
  // For pure unit tests that shouldn't load real styles, see CSS stub options below.
});