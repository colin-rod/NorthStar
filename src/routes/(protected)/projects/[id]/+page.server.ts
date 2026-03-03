/**
 * Project Detail Server Load
 *
 * Loads a project with its epics and issue counts.
 */

import { error, fail } from '@sveltejs/kit';

import type { PageServerLoad, Actions } from './$types';

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

  // Load epics with issues, dependencies, and milestone
  const { data: epics, error: epicsError } = await locals.supabase
    .from('epics')
    .select(
      `
      *,
      milestone:milestones(*),
      issues(
        *,
        dependencies!dependencies_issue_id_fkey(
          depends_on_issue_id,
          depends_on_issue:issues!dependencies_depends_on_issue_id_fkey(id, status)
        ),
        blocked_by:dependencies!dependencies_issue_id_fkey(
          depends_on_issue_id,
          depends_on_issue:issues!dependencies_depends_on_issue_id_fkey(
            id, title, status, priority, epic_id, project_id,
            epic:epics(id, name),
            project:projects(id, name)
          )
        ),
        blocking:dependencies!dependencies_depends_on_issue_id_fkey(
          issue_id,
          issue:issues!dependencies_issue_id_fkey(
            id, title, status, priority, epic_id, project_id,
            epic:epics(id, name),
            project:projects(id, name)
          )
        )
      )
    `,
    )
    .eq('project_id', params.id)
    .order('sort_order', { ascending: true });

  if (epicsError) {
    console.error('Error loading epics:', epicsError);
  }

  // Load milestones for milestone picker in EpicDetailSheet
  const { data: milestones } = await locals.supabase
    .from('milestones')
    .select('*')
    .order('due_date', { ascending: true, nullsFirst: false });

  // Compute counts for each epic
  const epicsWithCounts = (epics || []).map((epic) => ({
    ...epic,
    counts: computeIssueCounts(epic.issues || []),
  }));

  // Flatten all issues from all epics for drill-down view
  const allIssues = epicsWithCounts.flatMap((epic) =>
    (epic.issues || []).map((issue: Record<string, unknown>) => ({
      ...issue,
      epic: { id: epic.id, name: epic.name, status: epic.status },
      project: { id: project.id, name: project.name },
    })),
  );

  return {
    project,
    epics: epicsWithCounts,
    issues: allIssues,
    milestones: milestones || [],
    breadcrumbs: [
      { label: 'Projects', href: '/projects' },
      { label: project.name, href: `/projects/${project.id}`, current: true },
    ],
  };
};

export const actions: Actions = {
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
    if (epicId !== undefined && epicId !== '') {
      // Fetch issue to verify project ownership
      const { data: issue } = await supabase
        .from('issues')
        .select('project_id')
        .eq('id', id)
        .single();

      if (!issue) {
        return fail(404, { error: 'Issue not found' });
      }

      // Verify epic exists and belongs to same project as issue
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

    // Description (rich text HTML)
    const description = formData.get('description');
    if (description !== null) {
      updates.description = description.toString() === '' ? null : description.toString();
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
   * Create a new milestone
   */
  createMilestone: async ({ request, locals: { supabase, session } }) => {
    // 1. Auth check
    if (!session) {
      return fail(401, { error: 'Unauthorized' });
    }

    // 2. Parse form data
    const formData = await request.formData();
    const nameRaw = formData.get('name')?.toString();
    const dueDateRaw = formData.get('due_date')?.toString();

    // 3. Validate name
    if (!nameRaw) {
      return fail(400, { error: 'Milestone name is required' });
    }

    const name = nameRaw.trim();

    if (name.length === 0) {
      return fail(400, { error: 'Milestone name is required' });
    }

    if (name.length > 100) {
      return fail(400, { error: 'Milestone name must be 100 characters or less' });
    }

    // 4. Parse due_date (optional)
    let dueDate: string | null = null;
    if (dueDateRaw && dueDateRaw.trim() !== '') {
      dueDate = dueDateRaw.trim();
    }

    // 5. Insert milestone
    const { data, error: insertError } = await supabase
      .from('milestones')
      .insert({
        user_id: session.user.id,
        name,
        due_date: dueDate,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Create milestone error:', insertError);
      return fail(500, { error: 'Failed to create milestone' });
    }

    return { success: true, action: 'createMilestone', milestone: data };
  },

  /**
   * Update an existing milestone
   */
  updateMilestone: async ({ request, locals: { supabase, session } }) => {
    // 1. Auth check
    if (!session) {
      return fail(401, { error: 'Unauthorized' });
    }

    // 2. Parse form data
    const formData = await request.formData();
    const id = formData.get('id')?.toString();
    const nameRaw = formData.get('name')?.toString();
    const dueDateRaw = formData.get('due_date')?.toString();

    // 3. Validate ID
    if (!id) {
      return fail(400, { error: 'Milestone ID is required' });
    }

    // 4. Validate name
    if (!nameRaw) {
      return fail(400, { error: 'Milestone name is required' });
    }

    const name = nameRaw.trim();

    if (name.length === 0) {
      return fail(400, { error: 'Milestone name is required' });
    }

    if (name.length > 100) {
      return fail(400, { error: 'Milestone name must be 100 characters or less' });
    }

    // 5. Parse due_date (optional, nullable)
    let dueDate: string | null = null;
    if (dueDateRaw !== undefined) {
      if (dueDateRaw && dueDateRaw.trim() !== '') {
        dueDate = dueDateRaw.trim();
      }
      // If empty string or undefined, dueDate remains null
    }

    // 6. Update milestone (with user_id verification via RLS)
    const { data, error: updateError } = await supabase
      .from('milestones')
      .update({
        name,
        due_date: dueDate,
      })
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Update milestone error:', updateError);
      return fail(500, { error: 'Failed to update milestone' });
    }

    if (!data) {
      return fail(404, { error: 'Milestone not found or you do not have permission to edit it' });
    }

    return { success: true, action: 'updateMilestone', milestone: data };
  },
};
