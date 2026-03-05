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
   * Create a new epic in this project
   */
  createEpic: async ({ params, request, locals: { supabase, session } }) => {
    if (!session) return fail(401, { error: 'Unauthorized' });

    const formData = await request.formData();
    const name = formData.get('name')?.toString().trim();
    const status = formData.get('status')?.toString() || 'active';
    const projectId = params.id;

    if (!name || name.length === 0) {
      return fail(400, { error: 'Epic name is required' });
    }
    if (name.length > 100) {
      return fail(400, { error: 'Epic name must be 100 characters or less' });
    }
    if (!['backlog', 'active', 'on_hold', 'completed', 'canceled'].includes(status)) {
      return fail(400, { error: 'Invalid status' });
    }

    // Verify project exists and user owns it
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', session.user.id)
      .single();

    if (!project) {
      return fail(404, { error: 'Project not found' });
    }

    // Get max sort_order for this project
    const { data: maxOrderEpic } = await supabase
      .from('epics')
      .select('sort_order')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();

    const nextSortOrder = (maxOrderEpic?.sort_order ?? -1) + 1;

    const { data, error } = await supabase
      .from('epics')
      .insert({
        name,
        project_id: projectId,
        status,
        sort_order: nextSortOrder,
        is_default: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Create epic error:', error);
      return fail(500, { error: 'Failed to create epic' });
    }

    return { success: true, action: 'createEpic', epic: data };
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
      const validStatuses = ['backlog', 'todo', 'in_progress', 'in_review', 'done', 'canceled'];
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

  updateProject: async ({ request, locals: { supabase, session } }) => {
    if (!session) {
      return fail(401, { error: 'Unauthorized' });
    }

    const formData = await request.formData();
    const id = formData.get('id')?.toString();

    if (!id) {
      return fail(400, { error: 'Project ID is required' });
    }

    const updates: Record<string, unknown> = {};

    const name = formData.get('name');
    if (name !== null) {
      const trimmedName = name.toString().trim();
      if (trimmedName.length === 0) {
        return fail(400, { error: 'Project name is required' });
      }
      if (trimmedName.length > 100) {
        return fail(400, { error: 'Project name must be 100 characters or less' });
      }
      updates.name = trimmedName;
    }

    const description = formData.get('description');
    if (description !== null) {
      updates.description = description.toString() === '' ? null : description.toString();
    }

    const status = formData.get('status');
    if (status !== null) {
      const s = status.toString();
      if (!['backlog', 'planned', 'active', 'on_hold', 'completed', 'canceled'].includes(s)) {
        return fail(400, { error: 'Invalid status value' });
      }
      updates.status = s;
    }

    const color = formData.get('color');
    if (color !== null) {
      const validColors = [
        'gray',
        'red',
        'orange',
        'amber',
        'green',
        'teal',
        'blue',
        'violet',
        'pink',
        'rose',
      ];
      const c = color.toString();
      if (!validColors.includes(c)) {
        return fail(400, { error: 'Invalid color value' });
      }
      updates.color = c;
    }

    const icon = formData.get('icon');
    if (icon !== null) {
      updates.icon = icon.toString();
    }

    if (Object.keys(updates).length === 0) {
      return { success: true, action: 'update' };
    }

    const { error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Update project error:', error);
      return fail(500, { error: 'Failed to update project' });
    }

    return { success: true, action: 'update' };
  },

  createAttachment: async ({ request, locals: { supabase, session } }) => {
    if (!session) return fail(401, { error: 'Unauthorized' });

    const d = await request.formData();
    const entityType = d.get('entity_type')?.toString();
    const entityId = d.get('entity_id')?.toString();
    const fileName = d.get('file_name')?.toString();
    const fileSize = Number(d.get('file_size')?.toString() ?? '0');
    const mimeType = d.get('mime_type')?.toString();
    const storagePath = d.get('storage_path')?.toString();

    if (!entityType || !entityId || !fileName || !mimeType || !storagePath) {
      return fail(400, { error: 'Missing required attachment fields' });
    }

    const validEntityTypes = ['project', 'epic', 'issue'];
    if (!validEntityTypes.includes(entityType)) {
      return fail(400, { error: 'Invalid entity type' });
    }

    const { data, error } = await supabase
      .from('attachments')
      .insert({
        user_id: session.user.id,
        entity_type: entityType,
        entity_id: entityId,
        file_name: fileName,
        file_size: fileSize,
        mime_type: mimeType,
        storage_path: storagePath,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save attachment:', error);
      return fail(500, { error: 'Failed to save attachment' });
    }

    return { success: true, attachment: data };
  },

  deleteAttachment: async ({ request, locals: { supabase, session } }) => {
    if (!session) return fail(401, { error: 'Unauthorized' });

    const d = await request.formData();
    const id = d.get('id')?.toString();

    if (!id) return fail(400, { error: 'Attachment ID is required' });

    await supabase.from('attachments').delete().eq('id', id).eq('user_id', session.user.id);

    return { success: true };
  },

  createLink: async ({ request, locals: { supabase, session } }) => {
    if (!session) return fail(401, { error: 'Unauthorized' });

    const d = await request.formData();
    const entityType = d.get('entity_type')?.toString();
    const entityId = d.get('entity_id')?.toString();
    const url = d.get('url')?.toString();
    const label = d.get('label')?.toString();

    if (!entityType || !entityId || !url || !label) {
      return fail(400, { error: 'Missing required link fields' });
    }

    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        return fail(400, { error: 'URL must use http or https' });
      }
    } catch {
      return fail(400, { error: 'Invalid URL' });
    }

    const { data, error } = await supabase
      .from('links')
      .insert({
        user_id: session.user.id,
        entity_type: entityType,
        entity_id: entityId,
        url,
        label,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save link:', error);
      return fail(500, { error: 'Failed to save link' });
    }

    return { success: true, link: data };
  },

  deleteLink: async ({ request, locals: { supabase, session } }) => {
    if (!session) return fail(401, { error: 'Unauthorized' });

    const d = await request.formData();
    const id = d.get('id')?.toString();

    if (!id) return fail(400, { error: 'Link ID is required' });

    await supabase.from('links').delete().eq('id', id).eq('user_id', session.user.id);

    return { success: true };
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
