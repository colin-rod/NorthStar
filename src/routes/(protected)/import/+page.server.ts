import type { SupabaseClient } from '@supabase/supabase-js';
import { fail, redirect } from '@sveltejs/kit';

import type { PageServerLoad, Actions } from './$types';

import {
  parseProjectsCsv,
  parseEpicsCsv,
  parseIssuesCsv,
  type ParsedProject,
  type ParsedEpic,
  type ParsedIssue,
} from '$lib/utils/csv-import';

export const load: PageServerLoad = async ({ locals: { session } }) => {
  if (!session) {
    redirect(303, '/auth/login');
  }
  return {};
};

export const actions: Actions = {
  import: async ({ request, locals: { supabase, session } }) => {
    if (!session) return fail(401, { error: 'Unauthorized' });

    const formData = await request.formData();
    const entityType = formData.get('entity_type')?.toString();
    const file = formData.get('file') as File | null;

    if (!entityType || !['projects', 'epics', 'issues'].includes(entityType)) {
      return fail(400, { error: 'Invalid entity type' });
    }
    if (!file || file.size === 0) {
      return fail(400, { error: 'No file uploaded' });
    }

    const text = await file.text();

    if (entityType === 'projects') {
      return await importProjects(supabase, session.user.id, text);
    } else if (entityType === 'epics') {
      return await importEpics(supabase, session.user.id, text);
    } else {
      return await importIssues(supabase, session.user.id, text);
    }
  },
};

async function importProjects(supabase: SupabaseClient, userId: string, text: string) {
  const { rows, errors } = parseProjectsCsv(text);

  if (errors.length > 0) {
    return fail(400, { parseErrors: errors, imported: 0, entityType: 'projects' });
  }
  if (rows.length === 0) {
    return fail(400, { error: 'CSV has no data rows', imported: 0, entityType: 'projects' });
  }

  const toInsert = rows.map((r: ParsedProject) => ({
    name: r.name,
    status: r.status,
    user_id: userId,
  }));

  const { error } = await supabase.from('projects').insert(toInsert);

  if (error) {
    console.error('CSV import projects error:', error);
    return fail(500, { error: 'Failed to import projects', entityType: 'projects' });
  }

  return { success: true, imported: rows.length, entityType: 'projects' };
}

async function importEpics(supabase: SupabaseClient, userId: string, text: string) {
  const { rows, errors } = parseEpicsCsv(text);

  if (errors.length > 0) {
    return fail(400, { parseErrors: errors, imported: 0, entityType: 'epics' });
  }
  if (rows.length === 0) {
    return fail(400, { error: 'CSV has no data rows', imported: 0, entityType: 'epics' });
  }

  // Look up all unique project names at once
  const projectNames = [...new Set(rows.map((r: ParsedEpic) => r.project_name))];
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, name')
    .eq('user_id', userId)
    .in('name', projectNames);

  if (projectsError) {
    return fail(500, { error: 'Failed to look up projects', entityType: 'epics' });
  }

  const projectMap = new Map((projects || []).map((p) => [p.name, p.id]));

  // Validate all project names resolve
  const unknownProjects = projectNames.filter((name) => !projectMap.has(name));
  if (unknownProjects.length > 0) {
    return fail(400, {
      error: `Projects not found: ${unknownProjects.join(', ')}`,
      entityType: 'epics',
    });
  }

  // Get max sort_order per project for correct ordering
  const projectIds = [...projectMap.values()];
  const { data: existingEpics } = await supabase
    .from('epics')
    .select('project_id, sort_order')
    .in('project_id', projectIds)
    .order('sort_order', { ascending: false });

  const maxSortOrder = new Map<string, number>();
  for (const epic of existingEpics || []) {
    const current = maxSortOrder.get(epic.project_id) ?? -1;
    if ((epic.sort_order ?? -1) > current) {
      maxSortOrder.set(epic.project_id, epic.sort_order ?? 0);
    }
  }

  const toInsert = rows.map((r: ParsedEpic) => {
    const projectId = projectMap.get(r.project_name)!;
    const nextOrder = (maxSortOrder.get(projectId) ?? -1) + 1;
    maxSortOrder.set(projectId, nextOrder);
    return {
      name: r.name,
      project_id: projectId,
      status: r.status,
      sort_order: nextOrder,
      is_default: false,
    };
  });

  const { error } = await supabase.from('epics').insert(toInsert);

  if (error) {
    console.error('CSV import epics error:', error);
    return fail(500, { error: 'Failed to import epics', entityType: 'epics' });
  }

  return { success: true, imported: rows.length, entityType: 'epics' };
}

async function importIssues(supabase: SupabaseClient, userId: string, text: string) {
  const { rows, errors } = parseIssuesCsv(text);

  if (errors.length > 0) {
    return fail(400, { parseErrors: errors, imported: 0, entityType: 'issues' });
  }
  if (rows.length === 0) {
    return fail(400, { error: 'CSV has no data rows', imported: 0, entityType: 'issues' });
  }

  // Look up all unique project names
  const projectNames = [...new Set(rows.map((r: ParsedIssue) => r.project_name))];
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, name')
    .eq('user_id', userId)
    .in('name', projectNames);

  if (projectsError) {
    return fail(500, { error: 'Failed to look up projects', entityType: 'issues' });
  }

  const projectMap = new Map((projects || []).map((p) => [p.name, p.id]));
  const unknownProjects = projectNames.filter((name) => !projectMap.has(name));
  if (unknownProjects.length > 0) {
    return fail(400, {
      error: `Projects not found: ${unknownProjects.join(', ')}`,
      entityType: 'issues',
    });
  }

  // Look up epics for all projects
  const projectIds = [...projectMap.values()];
  const { data: epics, error: epicsError } = await supabase
    .from('epics')
    .select('id, project_id, name')
    .in('project_id', projectIds);

  if (epicsError) {
    return fail(500, { error: 'Failed to look up epics', entityType: 'issues' });
  }

  // Map: "project_id:epic_name" → epic_id
  const epicMap = new Map((epics || []).map((e) => [`${e.project_id}:${e.name}`, e.id]));

  // Validate all epic references resolve
  const unresolvedEpics: string[] = [];
  for (const row of rows) {
    const projectId = projectMap.get(row.project_name)!;
    const key = `${projectId}:${row.epic_name}`;
    if (!epicMap.has(key)) {
      unresolvedEpics.push(`"${row.epic_name}" in project "${row.project_name}"`);
    }
  }
  if (unresolvedEpics.length > 0) {
    const unique = [...new Set(unresolvedEpics)];
    return fail(400, {
      error: `Epics not found: ${unique.join(', ')}`,
      entityType: 'issues',
    });
  }

  // Get max sort_order per epic
  const epicIds = [...new Set([...epicMap.values()])];
  const { data: existingIssues } = await supabase
    .from('issues')
    .select('epic_id, sort_order')
    .in('epic_id', epicIds)
    .order('sort_order', { ascending: false });

  const maxSortOrder = new Map<string, number>();
  for (const issue of existingIssues || []) {
    const current = maxSortOrder.get(issue.epic_id) ?? -1;
    if ((issue.sort_order ?? -1) > current) {
      maxSortOrder.set(issue.epic_id, issue.sort_order ?? 0);
    }
  }

  const toInsert = rows.map((r: ParsedIssue) => {
    const projectId = projectMap.get(r.project_name)!;
    const epicId = epicMap.get(`${projectId}:${r.epic_name}`)!;
    const nextOrder = (maxSortOrder.get(epicId) ?? -1) + 1;
    maxSortOrder.set(epicId, nextOrder);
    return {
      title: r.title,
      project_id: projectId,
      epic_id: epicId,
      status: r.status,
      priority: r.priority,
      story_points: r.story_points,
      sort_order: nextOrder,
    };
  });

  const { error } = await supabase.from('issues').insert(toInsert);

  if (error) {
    console.error('CSV import issues error:', error);
    return fail(500, { error: 'Failed to import issues', entityType: 'issues' });
  }

  return { success: true, imported: rows.length, entityType: 'issues' };
}
