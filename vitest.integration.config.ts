import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load environment variables from .env.local
function loadEnvVars() {
  const envPath = resolve(process.cwd(), '.env.local');
  try {
    const envContent = readFileSync(envPath, 'utf-8');
    const env: Record<string, string> = {};

    envContent.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });

    return env;
  } catch (error) {
    console.warn('Could not load .env.local file for integration tests');
    return {};
  }
}

const env = loadEnvVars();

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ['tests/integration/**/*.test.ts'],
    exclude: ['**/node_modules/**'],
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/integration/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 30000,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true, // Sequential execution to avoid DB conflicts
      },
    },
    env,
  },
});
