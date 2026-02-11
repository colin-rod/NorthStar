import type { Handle } from '@sveltejs/kit';

import { createSupabaseServerClient } from '$lib/supabase.server';

/**
 * SvelteKit server hooks
 * Runs on every request to set up Supabase client and session in locals
 */
export const handle: Handle = async ({ event, resolve }) => {
  // Create Supabase client for this request
  event.locals.supabase = createSupabaseServerClient(event);

  // Get the current session (null if not authenticated)
  const {
    data: { session },
  } = await event.locals.supabase.auth.getSession();

  event.locals.session = session;

  return resolve(event);
};
