import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    exclude: ['test/stack/**'],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
