/**
 * Epic Detail Server Load
 *
 * Loads an epic with its issues.
 */

import { error, fail } from '@sveltejs/kit';

import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  // Load epic
  const { data: epic, error: epicError } = await locals.supabase
    .from('epics')
    .select(
      `
      *,
      project:projects(*)
    `,
    )
    .eq('id', params.id)
    .single();

  if (epicError || !epic) {
    throw error(404, 'Epic not found');
  }

  // Load issues in this epic with full dependency relations
  const { data: issues, error: issuesError } = await locals.supabase
    .from('issues')
    .select(
      `
      *,
      project:projects(*),
      epic:epics(*),
      milestone:milestones(*),
      dependencies!dependencies_issue_id_fkey(
        depends_on_issue_id,
        depends_on_issue:issues(*, epic:epics(*), project:projects(*))
      )
    `,
    )
    .eq('epic_id', params.id)
    .order('sort_order', { ascending: true });

  if (issuesError) {
    console.error('Error loading issues:', issuesError);
  }

  // Load all epics in the same project (for epic picker in IssueSheet)
  const { data: epics } = await locals.supabase
    .from('epics')
    .select('*')
    .eq('project_id', epic.project_id)
    .order('sort_order', { ascending: true });

  // Load all milestones for the user (global, cross-project)
  const { data: milestones } = await locals.supabase
    .from('milestones')
    .select('*')
    .order('name', { ascending: true });

  // Load ALL issues for dependency checking (needed for "blocking" calculation)
  const { data: allIssues } = await locals.supabase.from('issues').select(
    `
      id,
      title,
      status,
      epic_id,
      project_id,
      epic:epics(id, name),
      dependencies!dependencies_issue_id_fkey(
        issue_id,
        depends_on_issue_id
      )
    `,
  );

  return {
    epic,
    issues: issues || [],
    epics: epics || [],
    milestones: milestones || [],
    allIssues: allIssues || [],
  };
};

export const actions: Actions = {
  createIssue: async ({ request, locals: { supabase, session } }) => {
    // 1. Auth check
    if (!session) {
      return fail(401, { error: 'Unauthorized' });
    }

    // 2. Parse form data
    const formData = await request.formData();
    const title = formData.get('title')?.toString().trim();
    const epicId = formData.get('epic_id')?.toString();
    const projectId = formData.get('project_id')?.toString();

    // 3. Validation
    if (!title || title.length === 0) {
      return fail(400, { error: 'Issue title is required' });
    }
    if (title.length > 500) {
      return fail(400, { error: 'Issue title must be 500 characters or less' });
    }
    if (!epicId || !projectId) {
      return fail(400, { error: 'Epic and project are required' });
    }

    // 4. Get next sort_order (max + 1 in epic)
    const { data: existingIssues } = await supabase
      .from('issues')
      .select('sort_order')
      .eq('epic_id', epicId)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextSortOrder =
      existingIssues?.[0]?.sort_order != null ? existingIssues[0].sort_order + 1 : 0;

    // 5. Insert issue with defaults
    const { data, error: insertError } = await supabase
      .from('issues')
      .insert({
        title,
        epic_id: epicId,
        project_id: projectId,
        status: 'todo',
        priority: 2, // P2 default
        sort_order: nextSortOrder,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Create issue error:', insertError);
      return fail(500, { error: 'Failed to create issue' });
    }

    return { success: true, action: 'createIssue', issue: data };
  },

  reorderIssues: async ({ request, locals: { supabase, session } }) => {
    // 1. Auth check
    if (!session) {
      return fail(401, { error: 'Unauthorized' });
    }

    // 2. Parse batch updates
    const formData = await request.formData();
    const updatesJson = formData.get('updates')?.toString();

    if (!updatesJson) {
      return fail(400, { error: 'No updates provided' });
    }

    let updates: Array<{ id: string; sort_order: number }>;
    try {
      updates = JSON.parse(updatesJson);
    } catch (_e) {
      return fail(400, { error: 'Invalid updates format' });
    }

    // 3. Validate updates
    if (!Array.isArray(updates) || updates.length === 0) {
      return fail(400, { error: 'Invalid updates format' });
    }

    // 4. Batch update all changed sort_orders
    // Note: Supabase doesn't have batch update, so we use Promise.all
    const updatePromises = updates.map(({ id, sort_order }) =>
      supabase.from('issues').update({ sort_order }).eq('id', id),
    );

    const results = await Promise.all(updatePromises);

    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
      console.error('Reorder errors:', errors);
      return fail(500, { error: 'Failed to reorder issues' });
    }

    return { success: true, action: 'reorderIssues' };
  },
};
