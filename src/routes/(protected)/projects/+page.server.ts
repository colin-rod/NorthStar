import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, session } }) => {
	if (!session) {
		redirect(303, '/auth/login');
	}

	const { data: projects, error } = await supabase
		.from('projects')
		.select('*')
		.is('archived_at', null)
		.order('created_at', { ascending: false });

	if (error) {
		console.error('Error loading projects:', error);
		return { projects: [] };
	}

	return { projects: projects || [] };
};
