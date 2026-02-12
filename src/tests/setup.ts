import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock the Supabase client module for component tests
// This prevents components from trying to create a real Supabase client
vi.mock('$lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      select: vi.fn(() => Promise.resolve({ data: [], error: null })),
      update: vi.fn(() => Promise.resolve({ data: null, error: null })),
      delete: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  },
}));
