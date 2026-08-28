import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.svelte-kit/',
        'src/chelsea.json',
        '*.config.*',
        'dist/',
      ],
    },
    setupFiles: ['./src/test/setup.ts'],
    typecheck: {
      enabled: false,
    },
  },
  resolve: {
    alias: {
      $lib: '/src/lib',
    },
  },
});
