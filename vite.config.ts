import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [sveltekit()],
  resolve: {
    conditions: ['browser'],
  },
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.svelte-kit/**',
      '**/build/**',
      '**/coverage/**',
      'src/tests/integration/**',
    ],
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        '**/*.config.ts',
        '**/*.d.ts',
        '**/types/**',
        '**/__mocks__/**',
        'src/routes/**/+*.ts',
        'src/routes/**/+*.server.ts',
        // Exclude third-party UI library components (shadcn/svelte)
        'src/lib/components/ui/**',
        // Exclude re-export index files with no testable logic
        '**/index.ts',
      ],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
});
