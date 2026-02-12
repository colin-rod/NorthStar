import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock Supabase environment variables for component tests
// These are needed when components import $lib/supabase.ts
vi.stubGlobal('import.meta', {
  env: {
    PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    PUBLIC_SUPABASE_ANON_KEY: 'test-mock-key', // gitleaks:allow
  },
});
