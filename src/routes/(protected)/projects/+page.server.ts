import { redirect, fail } from '@sveltejs/kit';

import type { PageServerLoad, Actions } from './$types';

import {
  VALID_EPIC_STATUSES,
  VALID_PROJECT_STATUSES,
  VALID_ENTITY_TYPES,
  MAX_NAME_LENGTH,
} from '$lib/constants/validation';
import { handleUpdateIssue, handleCreateIssue } from '$lib/server/issue-actions';
import type { Project, Issue } from '$lib/types';
import { filterTree } from '$lib/utils/filter-tree';
import { computeIssueCounts } from '$lib/utils/issue-counts';
import { PROJECT_COLORS } from '$lib/utils/project-colors';
import { computeProjectMetrics } from '$lib/utils/project-helpers';
import { sortTree } from '$lib/utils/sort-tree';
import { parseTreeFilterParams } from '$lib/utils/tree-filter-params';

export const load: PageServerLoad = async ({ locals: { supabase, session }, url }) => {
  if (!session) {
    redirect(303, '/auth/login');
  }

  // Parse filter params from URL
  const filterParams = parseTreeFilterParams(url.searchParams);

  // Load all active projects (unfiltered)
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .is('archived_at', null)
    .order('created_at', { ascending: false });

  if (projectsError) {
    console.error('Error loading projects:', projectsError);
    return {
      projects: [],
      filterParams,
    };
  }

  // Batch load all epics and issues in 2 queries instead of N+1
  const projectIds = (projects || []).map((p) => p.id);

  const [{ data: allEpics }, { data: allIssues }] = await Promise.all([
    supabase
      .from('epics')
      .select(
        `
        id, project_id, number, name, description, status, priority, sort_order, is_default,
        milestone:milestones(id, name, due_date)
      `,
      )
      .in('project_id', projectIds)
      .order('sort_order', { ascending: true }),
    supabase
      .from('issues')
      .select(
        `
        id, project_id, epic_id, number, title, description, status,
        priority, story_points, sort_order, milestone_id, created_at,
        milestone:milestones(id, name, due_date),
        dependencies!dependencies_issue_id_fkey(
          issue_id,
          depends_on_issue_id,
          depends_on_issue:issues!dependencies_depends_on_issue_id_fkey(id, status, number, title)
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
      .in('project_id', projectIds)
      .order('sort_order', { ascending: true }),
  ]);

  // Group epics and issues by their parent IDs
  function groupByKey<T>(arr: T[], key: keyof T): Record<string, T[]> {
    return (arr || []).reduce(
      (acc, item) => {
        const k = String(item[key]);
        (acc[k] ??= []).push(item);
        return acc;
      },
      {} as Record<string, T[]>,
    );
  }

  const epicsByProjectId = groupByKey(allEpics || [], 'project_id');
  const issuesByEpicId = groupByKey(allIssues || [], 'epic_id');

  const projectsWithData = (projects || []).map((project) => {
    const epics = (epicsByProjectId[project.id] || []).map((epic) => ({
      ...epic,
      issues: issuesByEpicId[epic.id] || [],
      counts: computeIssueCounts((issuesByEpicId[epic.id] || []) as unknown as Issue[]),
    }));

    const allProjectIssues = epics.flatMap((epic) =>
      (issuesByEpicId[epic.id] || []).map((issue) => ({
        ...issue,
        epic: { id: epic.id, name: epic.name, status: epic.status },
        project: { id: project.id, name: project.name },
      })),
    );

    return {
      ...project,
      epics,
      issues: allProjectIssues,
      counts: computeIssueCounts(allProjectIssues as unknown as Issue[]),
      metrics: computeProjectMetrics(allProjectIssues as unknown as Issue[]),
    };
  });

  // Apply server-side filters
  const filteredProjects = filterTree(projectsWithData as Project[], {
    projectStatus: filterParams.projectStatus,
    epicStatus: filterParams.epicStatus,
    issuePriority: filterParams.issuePriority,
    issueStatus: filterParams.issueStatus,
    issueStoryPoints: filterParams.issueStoryPoints,
  }) as typeof projectsWithData;

  // Apply sorting
  const sortedProjects = sortTree(filteredProjects, filterParams.sortBy, filterParams.sortDir);

  // Load milestones for EpicDetailSheet milestone picker
  const { data: milestones } = await supabase
    .from('milestones')
    .select('*')
    .order('due_date', { ascending: true, nullsFirst: false });

  return {
    projects: sortedProjects,
    milestones: milestones || [],
    filterParams,
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
    if (name.length > MAX_NAME_LENGTH) {
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

    // Description (rich text HTML, optional field)
    const description = formData.get('description');
    if (description !== null) {
      updates.description = description.toString() === '' ? null : description.toString();
    }

    // Status
    const status = formData.get('status');
    if (status !== null) {
      const s = status.toString();
      if (!VALID_PROJECT_STATUSES.includes(s as (typeof VALID_PROJECT_STATUSES)[number])) {
        return fail(400, { error: 'Invalid status value' });
      }
      updates.status = s;
    }

    // Color
    const color = formData.get('color');
    if (color !== null) {
      const c = color.toString();
      if (!(c in PROJECT_COLORS)) {
        return fail(400, { error: 'Invalid color value' });
      }
      updates.color = c;
    }

    // Icon
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

  createEpic: async ({ request, locals: { supabase, session } }) => {
    if (!session) return fail(401, { error: 'Unauthorized' });

    const formData = await request.formData();
    const name = formData.get('name')?.toString().trim();
    const projectId = formData.get('projectId')?.toString();
    const status = formData.get('status')?.toString() || 'active';

    // Validation
    if (!name || name.length === 0) {
      return fail(400, { error: 'Epic name is required' });
    }
    if (name.length > MAX_NAME_LENGTH) {
      return fail(400, { error: 'Epic name must be 100 characters or less' });
    }
    if (!projectId) {
      return fail(400, { error: 'Project ID is required' });
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

    // Insert epic
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

  updateEpic: async ({ request, locals: { supabase, session } }) => {
    if (!session) return fail(401, { error: 'Unauthorized' });

    const formData = await request.formData();
    const id = formData.get('id')?.toString();
    const name = formData.get('name')?.toString().trim();
    const status = formData.get('status')?.toString();

    if (!id) {
      return fail(400, { error: 'Epic ID is required' });
    }

    // Build updates object
    const updates: Record<string, unknown> = {};
    if (name !== undefined) {
      if (name.length === 0) {
        return fail(400, { error: 'Epic name cannot be empty' });
      }
      if (name.length > MAX_NAME_LENGTH) {
        return fail(400, { error: 'Epic name must be 100 characters or less' });
      }
      updates.name = name;
    }
    if (status !== undefined) {
      if (!VALID_EPIC_STATUSES.includes(status as (typeof VALID_EPIC_STATUSES)[number])) {
        return fail(400, { error: 'Invalid status' });
      }
      updates.status = status;
    }

    // Description (rich text HTML, optional field)
    const description = formData.get('description');
    if (description !== null) {
      updates.description = description.toString() === '' ? null : description.toString();
    }

    // Milestone (optional, empty string → clear)
    const milestoneId = formData.get('milestone_id');
    if (milestoneId !== null) {
      updates.milestone_id = milestoneId.toString() === '' ? null : milestoneId.toString();
    }

    // Priority (optional, empty string → clear)
    const priority = formData.get('priority');
    if (priority !== null) {
      const p = priority.toString() === '' ? null : Number(priority.toString());
      if (p !== null && (isNaN(p) || p < 0 || p > 3)) {
        return fail(400, { error: 'Invalid priority' });
      }
      updates.priority = p;
    }

    if (Object.keys(updates).length === 0) {
      return fail(400, { error: 'No fields to update' });
    }

    // Update epic (RLS ensures user owns the project)
    const { error } = await supabase.from('epics').update(updates).eq('id', id);

    if (error) {
      console.error('Update epic error:', error);
      return fail(500, { error: 'Failed to update epic' });
    }

    return { success: true, action: 'updateEpic' };
  },

  createIssue: async ({ request, locals: { supabase, session } }) => {
    if (!session) return fail(401, { error: 'Unauthorized' });
    return handleCreateIssue(supabase, await request.formData());
  },

  updateIssue: async ({ request, locals: { supabase, session } }) => {
    if (!session) return fail(401, { error: 'Unauthorized' });
    return handleUpdateIssue(supabase, await request.formData());
  },

  updateCell: async ({ request, locals: { supabase, session } }) => {
    if (!session) return fail(401, { error: 'Unauthorized' });

    const formData = await request.formData();
    const nodeId = formData.get('nodeId')?.toString();
    const nodeType = formData.get('nodeType')?.toString();
    const field = formData.get('field')?.toString();
    const value = formData.get('value')?.toString();

    if (!nodeId || !nodeType || !field) {
      return fail(400, { error: 'Missing required fields' });
    }

    // Determine which table to update
    let table: string;
    if (nodeType === 'project') {
      table = 'projects';
    } else if (nodeType === 'epic') {
      table = 'epics';
    } else if (nodeType === 'issue') {
      table = 'issues';
    } else {
      return fail(400, { error: 'Invalid node type' });
    }

    // Build update object
    const updates: Record<string, unknown> = {};

    // Handle different field types
    if (field === 'title' || field === 'name') {
      const fieldName = nodeType === 'project' || nodeType === 'epic' ? 'name' : 'title';
      updates[fieldName] = value;
    } else if (field === 'status') {
      updates.status = value;
    } else if (field === 'milestone_id') {
      updates.milestone_id = value || null;
    } else if (field === 'story_points') {
      updates.story_points = value ? parseInt(value, 10) : null;
    } else if (field === 'priority') {
      updates.priority = value ? parseInt(value, 10) : null;
    } else {
      return fail(400, { error: 'Invalid field' });
    }

    // Update the record (RLS ensures user owns it)
    const { error } = await supabase.from(table).update(updates).eq('id', nodeId);

    if (error) {
      console.error('Update cell error:', error);
      return fail(500, { error: 'Failed to update cell' });
    }

    return { success: true, action: 'updateCell' };
  },

  reorderNodes: async ({ request, locals: { supabase, session } }) => {
    if (!session) return fail(401, { error: 'Unauthorized' });

    const formData = await request.formData();
    const updatesJson = formData.get('updates')?.toString();

    if (!updatesJson) {
      return fail(400, { error: 'Missing updates' });
    }

    const updates: { id: string; sort_order: number }[] = JSON.parse(updatesJson);

    if (!updates || updates.length === 0) {
      return fail(400, { error: 'Empty updates array' });
    }

    // Determine table based on first item
    const firstId = updates[0].id;

    // Check which table the ID belongs to
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', firstId)
      .maybeSingle();

    const { data: epic } = await supabase
      .from('epics')
      .select('id')
      .eq('id', firstId)
      .maybeSingle();

    const table = project ? 'projects' : epic ? 'epics' : 'issues';

    // Batch update sort_order
    const promises = updates.map(({ id, sort_order }) =>
      supabase.from(table).update({ sort_order }).eq('id', id),
    );

    const results = await Promise.all(promises);
    const errors = results.filter((r) => r.error);

    if (errors.length > 0) {
      console.error('Reorder errors:', errors);
      return fail(500, { error: 'Failed to reorder items' });
    }

    return { success: true, action: 'reorderNodes' };
  },

  reparentNode: async ({ request, locals: { supabase, session } }) => {
    if (!session) return fail(401, { error: 'Unauthorized' });

    const formData = await request.formData();
    const updateJson = formData.get('update')?.toString();

    if (!updateJson) {
      return fail(400, { error: 'Missing update' });
    }

    const update: {
      id: string;
      newSortOrder: number;
      newProjectId?: string;
      newEpicId?: string;
    } = JSON.parse(updateJson);

    // Determine table and build update object
    let table: string;
    const updates: Record<string, string | number | undefined> = {
      sort_order: update.newSortOrder,
    };

    if (update.newProjectId !== undefined && update.newEpicId === undefined) {
      // Epic reparent (moving to different project)
      table = 'epics';
      updates.project_id = update.newProjectId;
    } else if (update.newEpicId !== undefined) {
      // Issue reparent (to different epic)
      table = 'issues';
      updates.epic_id = update.newEpicId;
      if (update.newProjectId) updates.project_id = update.newProjectId;
    } else {
      return fail(400, { error: 'Invalid reparent update' });
    }

    // Update the node
    const { error } = await supabase.from(table).update(updates).eq('id', update.id);

    if (error) {
      console.error('Reparent error:', error);
      return fail(500, { error: 'Failed to move item' });
    }

    return { success: true, action: 'reparentNode' };
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

  deleteProject: async ({ request, locals: { supabase, session } }) => {
    if (!session) return fail(401, { error: 'Unauthorized' });

    const formData = await request.formData();
    const id = formData.get('id')?.toString();

    if (!id) return fail(400, { error: 'Project ID is required' });

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Delete project error:', error);
      return fail(500, { error: 'Failed to delete project' });
    }

    return { success: true, action: 'deleteProject' };
  },

  deleteEpic: async ({ request, locals: { supabase, session } }) => {
    if (!session) return fail(401, { error: 'Unauthorized' });

    const formData = await request.formData();
    const id = formData.get('id')?.toString();

    if (!id) return fail(400, { error: 'Epic ID is required' });

    // Get the epic's project_id
    const { data: epic } = await supabase.from('epics').select('project_id').eq('id', id).single();
    if (!epic) return fail(404, { error: 'Epic not found' });

    // Find the project's default (Unassigned) epic
    const { data: defaultEpic } = await supabase
      .from('epics')
      .select('id')
      .eq('project_id', epic.project_id)
      .eq('is_default', true)
      .single();
    if (!defaultEpic) return fail(500, { error: 'Default epic not found' });

    // Reassign all issues from deleted epic to Unassigned
    const { error: reassignError } = await supabase
      .from('issues')
      .update({ epic_id: defaultEpic.id })
      .eq('epic_id', id);
    if (reassignError) {
      console.error('Reassign issues error:', reassignError);
      return fail(500, { error: 'Failed to reassign issues' });
    }

    const { error } = await supabase.from('epics').delete().eq('id', id);

    if (error) {
      console.error('Delete epic error:', error);
      return fail(500, { error: 'Failed to delete epic' });
    }

    return { success: true, action: 'deleteEpic' };
  },

  deleteIssue: async ({ request, locals: { supabase, session } }) => {
    if (!session) return fail(401, { error: 'Unauthorized' });

    const formData = await request.formData();
    const id = formData.get('id')?.toString();

    if (!id) return fail(400, { error: 'Issue ID is required' });

    const { error } = await supabase.from('issues').delete().eq('id', id);

    if (error) {
      console.error('Delete issue error:', error);
      return fail(500, { error: 'Failed to delete issue' });
    }

    return { success: true, action: 'deleteIssue' };
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
};
