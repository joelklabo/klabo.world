import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['app/tests/**/*.spec.ts', 'packages/**/tests/**/*.spec.ts'],
    reporters: ['default'],
    watch: false,
    root: __dirname,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'app/src'),
      'contentlayer/generated': path.resolve(__dirname, 'app/.contentlayer/generated/index.mjs'),
      'react-tweet': path.resolve(__dirname, 'app/tests/mocks/react-tweet.tsx'),
    },
  },
});
