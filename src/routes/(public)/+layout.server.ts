import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	// Redirect authenticated users away from login page
	if (locals.session && url.pathname.startsWith('/auth/login')) {
		redirect(303, '/');
	}

	return { session: locals.session };
};
