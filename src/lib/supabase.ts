import { createBrowserClient } from '@supabase/ssr';

import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

/**
 * Client-side Supabase client singleton
 * Used in .svelte components and client-side logic
 */
export const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
