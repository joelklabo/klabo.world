import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['app/tests/**/*.spec.ts', 'packages/**/tests/**/*.spec.ts'],
    reporters: ['default'],
    watch: false
  }
});
