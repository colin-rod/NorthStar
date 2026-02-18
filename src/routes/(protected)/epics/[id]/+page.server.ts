/**
 * Epic Detail Server Load
 *
 * Loads an epic with its issues.
 */

import { error, fail } from '@sveltejs/kit';

import type { PageServerLoad, Actions } from './$types';

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
      ),
      sub_issues:issues!parent_issue_id(
        id,
        title,
        status,
        priority,
        sort_order
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
    // 1. Auth check
    if (!session) {
      return fail(401, { error: 'Unauthorized' });
    }

    // 2. Parse form data
    const formData = await request.formData();
    const titleRaw = formData.get('title')?.toString().trim();
    let epicId = formData.get('epic_id')?.toString();
    const projectId = formData.get('project_id')?.toString();
    const parentIssueId = formData.get('parent_issue_id')?.toString() || null;

    // 3. Validation
    if (!titleRaw || titleRaw.length === 0) {
      return fail(400, { error: 'Issue title is required' });
    }
    if (titleRaw.length > 500) {
      return fail(400, { error: 'Issue title must be 500 characters or less' });
    }
    if (!epicId || !projectId) {
      return fail(400, { error: 'Epic and project are required' });
    }

    // titleRaw is validated above to be non-empty
    const title = titleRaw;

    // 4. If creating sub-issue, validate parent and inherit epic
    if (parentIssueId) {
      // Fetch parent issue to inherit epic_id
      const { data: parentIssue, error: parentError } = await supabase
        .from('issues')
        .select('epic_id, project_id')
        .eq('id', parentIssueId)
        .single();

      if (parentError || !parentIssue) {
        return fail(400, { error: 'Parent issue not found' });
      }

      // Override epicId with parent's epic (force inheritance)
      epicId = parentIssue.epic_id;

      // Verify project matches (redundant with DB trigger, but good UX)
      if (parentIssue.project_id !== projectId) {
        return fail(400, { error: 'Sub-issue must be in same project as parent' });
      }
    }

    // 5. Get next sort_order (scoped to parent if sub-issue, or epic if top-level)
    let sortOrderQuery;
    if (parentIssueId) {
      // Sub-issue: sort order scoped to parent's sub-issues
      sortOrderQuery = supabase
        .from('issues')
        .select('sort_order')
        .eq('parent_issue_id', parentIssueId)
        .order('sort_order', { ascending: false })
        .limit(1);
    } else {
      // Top-level issue: sort order scoped to epic (exclude sub-issues)
      sortOrderQuery = supabase
        .from('issues')
        .select('sort_order')
        .eq('epic_id', epicId)
        .is('parent_issue_id', null)
        .order('sort_order', { ascending: false })
        .limit(1);
    }

    const { data: existingIssues } = await sortOrderQuery;
    const nextSortOrder =
      existingIssues?.[0]?.sort_order != null ? existingIssues[0].sort_order + 1 : 0;

    // 6. Insert issue with defaults
    const insertData: Record<string, string | number> = {
      title: title as string, // Validated above - titleRaw is non-empty string
      epic_id: epicId as string,
      project_id: projectId as string,
      status: 'todo',
      priority: 2, // P2 default
      sort_order: nextSortOrder,
    };

    // Add parent_issue_id if creating sub-issue
    if (parentIssueId) {
      insertData.parent_issue_id = parentIssueId;
    }

    const { data, error: insertError } = await supabase
      .from('issues')
      .insert(insertData)
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
};
