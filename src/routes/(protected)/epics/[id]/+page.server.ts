/**
 * Epic Detail Server Load
 *
 * Loads an epic with its issues.
 */

import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	// Load epic
	const { data: epic, error: epicError } = await locals.supabase
		.from('epics')
		.select(
			`
      *,
      project:projects(*)
    `
		)
		.eq('id', params.id)
		.single();

	if (epicError || !epic) {
		throw error(404, 'Epic not found');
	}

	// Load issues in this epic
	const { data: issues, error: issuesError } = await locals.supabase
		.from('issues')
		.select(
			`
      *,
      project:projects(*),
      epic:epics(*),
      milestone:milestones(*),
      dependencies:dependencies(
        depends_on_issue_id,
        depends_on_issue:issues(*)
      )
    `
		)
		.eq('epic_id', params.id)
		.order('sort_order', { ascending: true });

	if (issuesError) {
		console.error('Error loading issues:', issuesError);
	}

	return {
		epic,
		issues: issues || []
	};
};
