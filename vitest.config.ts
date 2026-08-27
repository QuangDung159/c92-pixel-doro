import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./apps/mobile/src', import.meta.url)),
    },
  },
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
    },
    include: [
      'packages/**/*.test.ts',
      'packages/**/*.test.tsx',
      'apps/mobile/**/*.test.ts',
      'apps/mobile/**/*.test.tsx',
    ],
    passWithNoTests: false,
  },
});
