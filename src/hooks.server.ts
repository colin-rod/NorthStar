import type { Handle } from '@sveltejs/kit';

import { createSupabaseServerClient } from '$lib/supabase.server';

/**
 * SvelteKit server hooks
 * Runs on every request to set up Supabase client and session in locals
 */
export const handle: Handle = async ({ event, resolve }) => {
  // Create Supabase client for this request
  event.locals.supabase = createSupabaseServerClient(event);

  // Get the current user (validates session token with Auth server)
  // Note: getUser() authenticates the session by contacting Supabase Auth server,
  // unlike getSession() which only reads from storage
  const {
    data: { user },
  } = await event.locals.supabase.auth.getUser();

  // If user is authenticated, retrieve the full session
  // The session is needed for other parts of the app that expect Session type
  if (user) {
    const {
      data: { session },
    } = await event.locals.supabase.auth.getSession();
    event.locals.session = session;
  } else {
    event.locals.session = null;
  }

  return resolve(event);
};
