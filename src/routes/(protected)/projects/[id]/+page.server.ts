/**
 * Project Detail Server Load
 *
 * Loads a project with its epics and issue counts.
 */

import { error, fail } from '@sveltejs/kit';

import type { PageServerLoad, Actions } from './$types';

import {
  VALID_EPIC_STATUSES,
  VALID_PROJECT_STATUSES,
  VALID_ENTITY_TYPES,
  MAX_NAME_LENGTH,
} from '$lib/constants/validation';
import { handleUpdateIssue } from '$lib/server/issue-actions';
import { computeIssueCounts } from '$lib/utils/issue-counts';
import { PROJECT_COLORS } from '$lib/utils/project-colors';

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
    if (name.length > MAX_NAME_LENGTH) {
      return fail(400, { error: 'Epic name must be 100 characters or less' });
    }
    if (!VALID_EPIC_STATUSES.includes(status as (typeof VALID_EPIC_STATUSES)[number])) {
      return fail(400, { error: 'Invalid status' });
    }

    // Verify project exists and user owns it
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', session.user.id)
      .maybeSingle();

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
      .maybeSingle();

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
    if (!session) return fail(401, { error: 'Unauthorized' });
    return handleUpdateIssue(supabase, await request.formData());
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

    if (name.length > MAX_NAME_LENGTH) {
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
      if (trimmedName.length > MAX_NAME_LENGTH) {
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
      if (!VALID_PROJECT_STATUSES.includes(s as (typeof VALID_PROJECT_STATUSES)[number])) {
        return fail(400, { error: 'Invalid status value' });
      }
      updates.status = s;
    }

    const color = formData.get('color');
    if (color !== null) {
      const c = color.toString();
      if (!(c in PROJECT_COLORS)) {
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

    if (!VALID_ENTITY_TYPES.includes(entityType as (typeof VALID_ENTITY_TYPES)[number])) {
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

    if (name.length > MAX_NAME_LENGTH) {
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
