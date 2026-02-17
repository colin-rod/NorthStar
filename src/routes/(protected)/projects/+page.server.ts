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
      // Load epics with nested issues and milestone
      const { data: epics } = await supabase
        .from('epics')
        .select(
          `
          *,
          milestone:milestones(*),
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

  // Load milestones for EpicDetailSheet milestone picker
  const { data: milestones } = await supabase
    .from('milestones')
    .select('*')
    .order('due_date', { ascending: true, nullsFirst: false });

  return {
    projects: projectsWithData,
    milestones: milestones || [],
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

    const updates: Record<string, unknown> = { name };

    // Description (rich text HTML, optional field)
    const description = formData.get('description');
    if (description !== null) {
      updates.description = description.toString() === '' ? null : description.toString();
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
    if (name.length > 100) {
      return fail(400, { error: 'Epic name must be 100 characters or less' });
    }
    if (!projectId) {
      return fail(400, { error: 'Project ID is required' });
    }
    if (!['active', 'done', 'canceled'].includes(status)) {
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
      if (name.length > 100) {
        return fail(400, { error: 'Epic name must be 100 characters or less' });
      }
      updates.name = name;
    }
    if (status !== undefined) {
      if (!['active', 'done', 'canceled'].includes(status)) {
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

    const formData = await request.formData();
    const title = formData.get('title')?.toString().trim();
    const epicId = formData.get('epicId')?.toString();
    const projectId = formData.get('projectId')?.toString();

    if (!title || title.length === 0) {
      return fail(400, { error: 'Issue title is required' });
    }
    if (!epicId) {
      return fail(400, { error: 'Epic ID is required' });
    }
    if (!projectId) {
      return fail(400, { error: 'Project ID is required' });
    }

    // Get max sort_order for this epic
    const { data: maxOrderIssue } = await supabase
      .from('issues')
      .select('sort_order')
      .eq('epic_id', epicId)
      .is('parent_issue_id', null)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextSortOrder = (maxOrderIssue?.sort_order ?? -1) + 1;

    // Insert issue
    const { data, error } = await supabase
      .from('issues')
      .insert({
        title,
        epic_id: epicId,
        project_id: projectId,
        status: 'todo',
        priority: 3, // Default P3
        sort_order: nextSortOrder,
      })
      .select()
      .single();

    if (error) {
      console.error('Create issue error:', error);
      return fail(500, { error: 'Failed to create issue' });
    }

    return { success: true, action: 'createIssue', issue: data };
  },

  createSubIssue: async ({ request, locals: { supabase, session } }) => {
    if (!session) return fail(401, { error: 'Unauthorized' });

    const formData = await request.formData();
    const title = formData.get('title')?.toString().trim();
    const parentIssueId = formData.get('parentIssueId')?.toString();
    const epicId = formData.get('epicId')?.toString();
    const projectId = formData.get('projectId')?.toString();

    if (!title || title.length === 0) {
      return fail(400, { error: 'Sub-issue title is required' });
    }
    if (!parentIssueId) {
      return fail(400, { error: 'Parent issue ID is required' });
    }
    if (!epicId) {
      return fail(400, { error: 'Epic ID is required' });
    }
    if (!projectId) {
      return fail(400, { error: 'Project ID is required' });
    }

    // Get max sort_order for sub-issues of this parent
    const { data: maxOrderSubIssue } = await supabase
      .from('issues')
      .select('sort_order')
      .eq('parent_issue_id', parentIssueId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextSortOrder = (maxOrderSubIssue?.sort_order ?? -1) + 1;

    // Insert sub-issue
    const { data, error } = await supabase
      .from('issues')
      .insert({
        title,
        parent_issue_id: parentIssueId,
        epic_id: epicId,
        project_id: projectId,
        status: 'todo',
        priority: 3, // Default P3
        sort_order: nextSortOrder,
      })
      .select()
      .single();

    if (error) {
      console.error('Create sub-issue error:', error);
      return fail(500, { error: 'Failed to create sub-issue' });
    }

    return { success: true, action: 'createSubIssue', subIssue: data };
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
    } else if (nodeType === 'issue' || nodeType === 'sub-issue') {
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
      newParentIssueId?: string;
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
    } else if (update.newEpicId !== undefined && update.newParentIssueId === undefined) {
      // Issue reparent (to different epic)
      table = 'issues';
      updates.epic_id = update.newEpicId;
      if (update.newProjectId) updates.project_id = update.newProjectId;
    } else if (update.newParentIssueId !== undefined) {
      // Sub-issue reparent (to different parent issue)
      table = 'issues';
      updates.parent_issue_id = update.newParentIssueId;
      updates.epic_id = update.newEpicId;
      updates.project_id = update.newProjectId;
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
};
