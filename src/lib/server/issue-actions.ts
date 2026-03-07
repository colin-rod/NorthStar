import type { SupabaseClient } from '@supabase/supabase-js';
import { fail } from '@sveltejs/kit';

import {
  VALID_ISSUE_STATUSES,
  VALID_STORY_POINTS,
  DEFAULT_ISSUE_PRIORITY,
  MAX_ISSUE_TITLE_LENGTH,
} from '$lib/constants/validation';

export async function handleUpdateIssue(supabase: SupabaseClient, formData: FormData) {
  const id = formData.get('id')?.toString();

  if (!id) {
    return fail(400, { error: 'Issue ID is required' });
  }

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
    if (!VALID_ISSUE_STATUSES.includes(status as (typeof VALID_ISSUE_STATUSES)[number])) {
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
      if (!VALID_STORY_POINTS.includes(storyPoints as (typeof VALID_STORY_POINTS)[number])) {
        return fail(400, { error: 'Story points must be one of: 1, 2, 3, 5, 8, 13, 21' });
      }
      updates.story_points = storyPoints;
    }
  }

  // Epic ID
  const epicId = formData.get('epic_id')?.toString();
  if (epicId !== undefined && epicId !== '') {
    const { data: issue } = await supabase
      .from('issues')
      .select('project_id')
      .eq('id', id)
      .maybeSingle();

    if (!issue) {
      return fail(404, { error: 'Issue not found' });
    }

    const { data: epic, error: epicError } = await supabase
      .from('epics')
      .select('id, project_id')
      .eq('id', epicId)
      .eq('project_id', issue.project_id)
      .maybeSingle();

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
      const { data: milestone, error: milestoneError } = await supabase
        .from('milestones')
        .select('id')
        .eq('id', milestoneId)
        .maybeSingle();

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

  const { data, error: updateError } = await supabase
    .from('issues')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (updateError) {
    console.error('Failed to update issue:', updateError);
    return fail(500, { error: 'Failed to update issue' });
  }

  return { success: true, action: 'updateIssue', issue: data };
}

export async function handleCreateIssue(supabase: SupabaseClient, formData: FormData) {
  const titleRaw = formData.get('title')?.toString().trim();
  const epicId = formData.get('epicId')?.toString();
  const projectId = formData.get('projectId')?.toString();

  if (!titleRaw || titleRaw.length === 0) {
    return fail(400, { error: 'Issue title is required' });
  }
  if (titleRaw.length > MAX_ISSUE_TITLE_LENGTH) {
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
    .maybeSingle();

  if (epicError || !epic) {
    return fail(400, { error: 'Epic not found or does not belong to selected project' });
  }

  // Get next sort_order (scoped to epic)
  const { data: maxOrderIssue } = await supabase
    .from('issues')
    .select('sort_order')
    .eq('epic_id', epicId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSortOrder = (maxOrderIssue?.sort_order ?? -1) + 1;

  const { data, error: insertError } = await supabase
    .from('issues')
    .insert({
      title: titleRaw,
      epic_id: epicId,
      project_id: projectId,
      status: 'todo',
      priority: DEFAULT_ISSUE_PRIORITY,
      sort_order: nextSortOrder,
    })
    .select()
    .single();

  if (insertError) {
    console.error('Create issue error:', insertError);
    return fail(500, { error: 'Failed to create issue' });
  }

  return { success: true, action: 'createIssue', issue: data };
}
