import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, session } }) => {
	if (!session) {
		redirect(303, '/auth/login');
	}

	const { data: issues, error } = await supabase
		.from('issues')
		.select('*, epic:epics(*), project:projects(*)')
		.order('created_at', { ascending: false });

	if (error) {
		console.error('Error loading issues for search:', error);
		return { issues: [] };
	}

	return { issues: issues || [] };
};
