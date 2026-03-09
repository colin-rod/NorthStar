/**
 * Epic Detail Server Load
 *
 * Loads an epic with its issues.
 */

import { error, fail } from '@sveltejs/kit';

import type { PageServerLoad, Actions } from './$types';

import { VALID_ENTITY_TYPES, MAX_NAME_LENGTH } from '$lib/constants/validation';
import { handleUpdateIssue, handleCreateIssue } from '$lib/server/issue-actions';
import { MAX_FILE_SIZE_BYTES, ALLOWED_MIME_TYPES } from '$lib/utils/attachment-helpers';
import { parsePriorities, parseMilestones } from '$lib/utils/url-helpers';

export const load: PageServerLoad = async ({ params, locals, url }) => {
  // Parse query params for filtering
  const priorityParam = url.searchParams.get('priority');
  const selectedPriorities = parsePriorities(priorityParam);

  const milestoneParam = url.searchParams.get('milestone');
  const { milestoneIds: selectedMilestoneIds, includeNoMilestone } =
    parseMilestones(milestoneParam);
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

  // Load issues in this epic with full dependency relations and sub-issues
  let issuesQuery = locals.supabase
    .from('issues')
    .select(
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
      )
    `,
    )
    .eq('epic_id', params.id);

  // Apply priority filter
  if (selectedPriorities.length > 0 && selectedPriorities.length < 4) {
    issuesQuery = issuesQuery.in('priority', selectedPriorities);
  }

  // Apply milestone filter
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

  const { data: issues, error: issuesError } = await issuesQuery.order('sort_order', {
    ascending: true,
  });

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

  return {
    epic,
    issues: issues || [],
    epics: epics || [],
    milestones: milestones || [],
    selectedPriorities,
    selectedMilestoneIds,
    includeNoMilestone,
    breadcrumbs: [
      { label: 'Projects', href: '/projects' },
      { label: epic.project.name, href: `/projects/${epic.project_id}` },
      { label: epic.name, href: `/epics/${epic.id}`, current: true },
    ],
  };
};

export const actions: Actions = {
  createIssue: async ({ request, locals: { supabase, session } }) => {
    if (!session) return fail(401, { error: 'Unauthorized' });
    return handleCreateIssue(supabase, await request.formData());
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
   * Save attachment metadata after client-side upload to Supabase Storage
   */
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

    if (isNaN(fileSize) || fileSize <= 0 || fileSize > MAX_FILE_SIZE_BYTES) {
      return fail(400, { error: 'Invalid file size' });
    }

    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return fail(400, { error: 'File type not allowed' });
    }

    if (!storagePath.startsWith(`${session.user.id}/`)) {
      return fail(400, { error: 'Invalid storage path' });
    }

    const sanitizedFileName = fileName.replace(/[/\\]/g, '_');

    const { data, error } = await supabase
      .from('attachments')
      .insert({
        user_id: session.user.id,
        entity_type: entityType,
        entity_id: entityId,
        file_name: sanitizedFileName,
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

  /**
   * Delete attachment metadata (client handles storage file removal)
   */
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
   * Update an issue
   */
  updateIssue: async ({ request, locals: { supabase, session } }) => {
    if (!session) return fail(401, { error: 'Unauthorized' });
    return handleUpdateIssue(supabase, await request.formData());
  },
};
