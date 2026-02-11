import { redirect } from '@sveltejs/kit';

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  // Protect all routes in this group
  if (!locals.session) {
    redirect(303, '/auth/login');
  }

  return { session: locals.session };
};
