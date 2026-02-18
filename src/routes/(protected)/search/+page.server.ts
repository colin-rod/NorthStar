import { redirect } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';

// Search is now handled inline in the navbar.
export const load: PageServerLoad = async ({ locals: { session } }) => {
  if (!session) {
    redirect(303, '/auth/login');
  }
  redirect(303, '/');
};
