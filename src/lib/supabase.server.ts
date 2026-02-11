import { createServerClient } from '@supabase/ssr';
import type { RequestEvent } from '@sveltejs/kit';

import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

/**
 * Server-side Supabase client factory
 * Creates a Supabase client with cookie-based auth for server contexts
 *
 * Used in:
 * - +page.server.ts load functions
 * - +layout.server.ts load functions
 * - Form actions
 * - Server hooks
 */
export function createSupabaseServerClient(event: RequestEvent) {
  return createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get: (key) => event.cookies.get(key),
      set: (key, value, options) => {
        event.cookies.set(key, value, { ...options, path: '/' });
      },
      remove: (key, options) => {
        event.cookies.delete(key, { ...options, path: '/' });
      },
    },
  });
}
