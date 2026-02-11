/**
 * Home Page Server Load
 *
 * Loads all issues with their relations for the home view.
 */

import { redirect, fail } from '@sveltejs/kit';

import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const { data: issues, error } = await locals.supabase
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
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error loading issues:', error);
    return { issues: [], epics: [], milestones: [] };
  }

  // Load all epics for the user (for epic picker in IssueSheet)
  const { data: epics } = await locals.supabase
    .from('epics')
    .select('*')
    .order('sort_order', { ascending: true });

  // Load all milestones for the user (global, cross-project)
  const { data: milestones } = await locals.supabase
    .from('milestones')
    .select('*')
    .order('name', { ascending: true });

  return {
    issues: issues || [],
    epics: epics || [],
    milestones: milestones || [],
  };
};

/**
 * Form Actions
 */
export const actions: Actions = {
  /**
   * Logout action
   */
  logout: async ({ locals: { supabase } }) => {
    await supabase.auth.signOut();
    redirect(303, '/auth/login');
  },

  /**
   * Update an issue
   */
  updateIssue: async ({ request, locals: { supabase, session } }) => {
    // 1. Auth check
    if (!session) {
      return fail(401, { error: 'Unauthorized' });
    }

    // 2. Parse form data
    const formData = await request.formData();
    const id = formData.get('id')?.toString();

    if (!id) {
      return fail(400, { error: 'Issue ID is required' });
    }

    // 3. Build update object from form data
    const updates: Record<string, string | number | null> = {};

    // Title
    const title = formData.get('title')?.toString();
    if (title !== undefined) {
      if (title.trim().length === 0) {
        return fail(400, { error: 'Issue title cannot be empty' });
      }
      updates.title = title.trim();
    }

    // Status
    const status = formData.get('status')?.toString();
    if (status !== undefined) {
      const validStatuses = ['todo', 'doing', 'in_review', 'done', 'canceled'];
      if (!validStatuses.includes(status)) {
        return fail(400, { error: 'Invalid status value' });
      }
      updates.status = status;
    }

    // Priority
    const priority = formData.get('priority')?.toString();
    if (priority !== undefined) {
      const priorityNum = parseInt(priority);
      if (isNaN(priorityNum) || priorityNum < 0 || priorityNum > 3) {
        return fail(400, { error: 'Priority must be between 0 and 3' });
      }
      updates.priority = priorityNum;
    }

    // Story points
    const storyPointsStr = formData.get('story_points')?.toString();
    if (storyPointsStr !== undefined) {
      if (storyPointsStr === '' || storyPointsStr === 'null') {
        updates.story_points = null;
      } else {
        const storyPoints = parseInt(storyPointsStr);
        if (isNaN(storyPoints)) {
          return fail(400, { error: 'Invalid story points value' });
        }
        const validStoryPoints = [1, 2, 3, 5, 8, 13, 21];
        if (!validStoryPoints.includes(storyPoints)) {
          return fail(400, { error: 'Story points must be one of: 1, 2, 3, 5, 8, 13, 21' });
        }
        updates.story_points = storyPoints;
      }
    }

    // Epic ID
    const epicId = formData.get('epic_id')?.toString();
    if (epicId !== undefined) {
      // Verify epic exists and belongs to same project as issue
      const { data: issue } = await supabase
        .from('issues')
        .select('project_id')
        .eq('id', id)
        .single();

      if (!issue) {
        return fail(404, { error: 'Issue not found' });
      }

      const { data: epic, error: epicError } = await supabase
        .from('epics')
        .select('id, project_id')
        .eq('id', epicId)
        .eq('project_id', issue.project_id)
        .single();

      if (epicError || !epic) {
        return fail(400, { error: 'Epic not found or does not belong to same project' });
      }

      updates.epic_id = epicId;
    }

    // Milestone ID
    const milestoneId = formData.get('milestone_id')?.toString();
    if (milestoneId !== undefined) {
      if (milestoneId === '' || milestoneId === 'null') {
        updates.milestone_id = null;
      } else {
        // Verify milestone exists
        const { data: milestone, error: milestoneError } = await supabase
          .from('milestones')
          .select('id')
          .eq('id', milestoneId)
          .single();

        if (milestoneError || !milestone) {
          return fail(400, { error: 'Milestone not found' });
        }

        updates.milestone_id = milestoneId;
      }
    }

    // 4. Update issue in database
    const { data, error: updateError } = await supabase
      .from('issues')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update issue:', updateError);
      return fail(500, { error: 'Failed to update issue' });
    }

    return { success: true, action: 'updateIssue', issue: data };
  },

  /**
   * Create a new issue
   */
  createIssue: async ({ request }) => {
    const _formData = await request.formData();

    // TODO: Validate form data
    // TODO: Create issue in database
    // TODO: Return success/error with new issue ID

    return { success: true };
  },
};
