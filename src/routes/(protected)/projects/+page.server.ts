import { redirect, fail } from '@sveltejs/kit';

import type { PageServerLoad, Actions } from './$types';

import { computeIssueCounts } from '$lib/utils/issue-counts';
import { computeProjectMetrics } from '$lib/utils/project-helpers';

export const load: PageServerLoad = async ({ locals: { supabase, session } }) => {
  if (!session) {
    redirect(303, '/auth/login');
  }

  // Load all active projects
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .is('archived_at', null)
    .order('created_at', { ascending: false });

  if (projectsError) {
    console.error('Error loading projects:', projectsError);
    return { projects: [] };
  }

  // For each project, load epics with issues and dependencies
  const projectsWithData = await Promise.all(
    (projects || []).map(async (project) => {
      // Load epics with nested issues
      const { data: epics } = await supabase
        .from('epics')
        .select(
          `
          *,
          issues(
            *,
            dependencies!dependencies_issue_id_fkey(
              depends_on_issue_id,
              depends_on_issue:issues!dependencies_depends_on_issue_id_fkey(*)
            )
          )
        `,
        )
        .eq('project_id', project.id)
        .order('sort_order', { ascending: true });

      // Compute counts for each epic
      const epicsWithCounts = (epics || []).map((epic) => ({
        ...epic,
        counts: computeIssueCounts(epic.issues || []),
      }));

      // Flatten all issues for project
      const allIssues = epicsWithCounts.flatMap((epic) =>
        (epic.issues || []).map((issue: Record<string, unknown>) => ({
          ...issue,
          epic: { id: epic.id, name: epic.name, status: epic.status },
          project: { id: project.id, name: project.name },
        })),
      );

      // Compute project-level counts
      const projectCounts = computeIssueCounts(allIssues);

      // Compute project metrics (story points and issue count)
      const projectMetrics = computeProjectMetrics(allIssues);

      return {
        ...project,
        epics: epicsWithCounts,
        issues: allIssues,
        counts: projectCounts,
        metrics: projectMetrics,
      };
    }),
  );

  return {
    projects: projectsWithData,
  };
};

export const actions: Actions = {
  createProject: async ({ request, locals: { supabase, session } }) => {
    if (!session) {
      return fail(401, { error: 'Unauthorized' });
    }

    const formData = await request.formData();
    const name = formData.get('name')?.toString().trim();

    // Validation
    if (!name || name.length === 0) {
      return fail(400, { error: 'Project name is required' });
    }
    if (name.length > 100) {
      return fail(400, { error: 'Project name must be 100 characters or less' });
    }

    // Insert project (DB trigger will auto-create "Unassigned" epic)
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name,
        user_id: session.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Create project error:', error);
      return fail(500, { error: 'Failed to create project' });
    }

    return { success: true, action: 'create', project: data };
  },

  updateProject: async ({ request, locals: { supabase, session } }) => {
    if (!session) {
      return fail(401, { error: 'Unauthorized' });
    }

    const formData = await request.formData();
    const id = formData.get('id')?.toString();
    const name = formData.get('name')?.toString().trim();

    if (!id) {
      return fail(400, { error: 'Project ID is required' });
    }
    if (!name || name.length === 0) {
      return fail(400, { error: 'Project name is required' });
    }
    if (name.length > 100) {
      return fail(400, { error: 'Project name must be 100 characters or less' });
    }

    const { error } = await supabase
      .from('projects')
      .update({ name })
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Update project error:', error);
      return fail(500, { error: 'Failed to update project' });
    }

    return { success: true, action: 'update' };
  },

  archiveProject: async ({ request, locals: { supabase, session } }) => {
    if (!session) {
      return fail(401, { error: 'Unauthorized' });
    }

    const formData = await request.formData();
    const id = formData.get('id')?.toString();

    if (!id) {
      return fail(400, { error: 'Project ID is required' });
    }

    const { error } = await supabase
      .from('projects')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Archive project error:', error);
      return fail(500, { error: 'Failed to archive project' });
    }

    return { success: true, action: 'archive' };
  },
};
