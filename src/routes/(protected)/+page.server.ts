/**
 * Home Page Server Load
 *
 * Loads all issues with their relations for the home view.
 * Supports optional project filtering via URL query parameter.
 */

import { redirect, fail } from '@sveltejs/kit';

import type { PageServerLoad, Actions } from './$types';

import {
  parseProjectIds,
  parsePriorities,
  parseMilestones,
  parseStatuses,
  parseStoryPoints,
} from '$lib/utils/url-helpers';

export const load: PageServerLoad = async ({ locals, url }) => {
  // 1. Parse query params
  const projectsParam = url.searchParams.get('projects');
  const selectedProjectIds = parseProjectIds(projectsParam);

  const priorityParam = url.searchParams.get('priority');
  const selectedPriorities = parsePriorities(priorityParam);

  const milestoneParam = url.searchParams.get('milestone');
  const { milestoneIds: selectedMilestoneIds, includeNoMilestone } =
    parseMilestones(milestoneParam);

  const statusParam = url.searchParams.get('status');
  const selectedStatuses = parseStatuses(statusParam);

  const storyPointsParam = url.searchParams.get('story_points');
  const selectedStoryPoints = parseStoryPoints(storyPointsParam);

  const groupBy = url.searchParams.get('group_by') || 'none';
  const sortBy = url.searchParams.get('sort_by') || 'priority';
  const sortDir = url.searchParams.get('sort_dir') || 'asc';

  // 2. Build issues query
  let issuesQuery = locals.supabase.from('issues').select(
    `
      *,
      project:projects(*),
      epic:epics(*),
      milestone:milestones(*),
      dependencies!dependencies_issue_id_fkey(
        depends_on_issue_id,
        depends_on_issue:issues!dependencies_depends_on_issue_id_fkey(*, epic:epics(*), project:projects(*))
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
      ),
      sub_issues:issues!parent_issue_id(
        id,
        title,
        status,
        priority,
        sort_order
      )
    `,
  );

  // 3. Apply filters if specified
  if (selectedProjectIds.length > 0) {
    issuesQuery = issuesQuery.in('project_id', selectedProjectIds);
  }

  // Priority filter
  if (selectedPriorities.length > 0 && selectedPriorities.length < 4) {
    issuesQuery = issuesQuery.in('priority', selectedPriorities);
  }

  // Milestone filter
  if (selectedMilestoneIds.length > 0 || includeNoMilestone) {
    if (includeNoMilestone && selectedMilestoneIds.length > 0) {
      // Show both specific milestones AND no milestone
      issuesQuery = issuesQuery.or(
        `milestone_id.in.(${selectedMilestoneIds.join(',')}),milestone_id.is.null`,
      );
    } else if (includeNoMilestone) {
      issuesQuery = issuesQuery.is('milestone_id', null);
    } else {
      issuesQuery = issuesQuery.in('milestone_id', selectedMilestoneIds);
    }
  }

  const { data: issues, error } = await issuesQuery.order('sort_order', { ascending: true });

  if (error) {
    console.error('Error loading issues:', error);
    return { issues: [], projects: [], epics: [], milestones: [], selectedProjectIds: [] };
  }

  // 4. Load projects for filter dropdown
  const { data: projects } = await locals.supabase
    .from('projects')
    .select('id, name')
    .order('name', { ascending: true });

  // 5. Load all epics for the user (for epic picker in IssueSheet)
  const { data: epics } = await locals.supabase
    .from('epics')
    .select('*')
    .order('sort_order', { ascending: true });

  // 6. Load all milestones for the user (global, cross-project)
  const { data: milestones } = await locals.supabase
    .from('milestones')
    .select('*')
    .order('name', { ascending: true });

  return {
    issues: issues || [],
    projects: projects || [],
    epics: epics || [],
    milestones: milestones || [],
    selectedProjectIds,
    selectedPriorities,
    selectedMilestoneIds,
    includeNoMilestone,
    selectedStatuses,
    selectedStoryPoints,
    groupBy,
    sortBy,
    sortDir,
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
      // Check if this is a sub-issue (has parent_issue_id)
      const { data: issue } = await supabase
        .from('issues')
        .select('parent_issue_id, project_id')
        .eq('id', id)
        .single();

      if (!issue) {
        return fail(404, { error: 'Issue not found' });
      }

      // Block epic changes for sub-issues
      if (issue.parent_issue_id) {
        return fail(400, {
          error: 'Cannot change epic for sub-issues - they inherit from parent',
        });
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

  /**
   * Create a new issue
   */
  createIssue: async ({ request, locals: { supabase, session } }) => {
    if (!session) {
      return fail(401, { error: 'Unauthorized' });
    }

    const formData = await request.formData();
    const titleRaw = formData.get('title')?.toString().trim();
    const epicId = formData.get('epic_id')?.toString();
    const projectId = formData.get('project_id')?.toString();

    if (!titleRaw || titleRaw.length === 0) {
      return fail(400, { error: 'Issue title is required' });
    }
    if (titleRaw.length > 500) {
      return fail(400, { error: 'Issue title must be 500 characters or less' });
    }
    if (!epicId || !projectId) {
      return fail(400, { error: 'Epic and project are required' });
    }

    // Verify epic belongs to selected project
    const { data: epic, error: epicError } = await supabase
      .from('epics')
      .select('id, project_id')
      .eq('id', epicId)
      .eq('project_id', projectId)
      .single();

    if (epicError || !epic) {
      return fail(400, { error: 'Epic not found or does not belong to selected project' });
    }

    // Get next sort_order (scoped to epic, exclude sub-issues)
    const { data: existingIssues } = await supabase
      .from('issues')
      .select('sort_order')
      .eq('epic_id', epicId)
      .is('parent_issue_id', null)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextSortOrder =
      existingIssues?.[0]?.sort_order != null ? existingIssues[0].sort_order + 1 : 0;

    const { data, error: insertError } = await supabase
      .from('issues')
      .insert({
        title: titleRaw,
        epic_id: epicId,
        project_id: projectId,
        status: 'todo',
        priority: 2,
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
};
