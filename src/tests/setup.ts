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
    storage: {
      from: vi.fn(() => ({
        createSignedUrl: vi.fn(() =>
          Promise.resolve({ data: { signedUrl: 'https://example.com/signed' }, error: null }),
        ),
        upload: vi.fn(() => Promise.resolve({ data: { path: 'test/path' }, error: null })),
        remove: vi.fn(() => Promise.resolve({ data: null, error: null })),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/public' } })),
      })),
    },
  },
}));
