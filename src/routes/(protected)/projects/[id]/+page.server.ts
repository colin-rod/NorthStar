/**
 * Project Detail Server Load
 *
 * Loads a project with its epics and issue counts.
 */

import { error } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';

import { computeIssueCounts } from '$lib/utils/issue-counts';

export const load: PageServerLoad = async ({ params, locals }) => {
  // Load project
  const { data: project, error: projectError } = await locals.supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .single();

  if (projectError || !project) {
    throw error(404, 'Project not found');
  }

  // Load epics with issues and dependencies
  const { data: epics, error: epicsError } = await locals.supabase
    .from('epics')
    .select(
      `
      *,
      issues(
        *,
        dependencies:dependencies(
          depends_on_issue_id,
          depends_on_issue:issues(*)
        )
      )
    `,
    )
    .eq('project_id', params.id)
    .order('sort_order', { ascending: true });

  if (epicsError) {
    console.error('Error loading epics:', epicsError);
  }

  // Compute counts for each epic
  const epicsWithCounts = (epics || []).map((epic) => ({
    ...epic,
    counts: computeIssueCounts(epic.issues || []),
  }));

  return {
    project,
    epics: epicsWithCounts,
  };
};
