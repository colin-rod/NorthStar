import { json, redirect } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request, locals: { supabase, session } }) => {
  if (!session) {
    redirect(303, '/auth/login');
  }

  const url = new URL(request.url);
  const q = url.searchParams.get('q')?.trim() ?? '';

  let issuesQuery = supabase
    .from('issues')
    .select(
      `
      *,
      project:projects(*),
      epic:epics(*),
      milestone:milestones(*),
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
    .order('created_at', { ascending: false })
    .limit(20);

  if (q) {
    issuesQuery = issuesQuery.ilike('title', `%${q}%`);
  }

  const [issuesResult, epicsResult, milestonesResult] = await Promise.all([
    issuesQuery,
    supabase
      .from('epics')
      .select('id, number, name, description, project_id, status, priority, sort_order, is_default')
      .order('sort_order', { ascending: true }),
    supabase.from('milestones').select('*').order('name', { ascending: true }),
  ]);

  return json({
    issues: issuesResult.data ?? [],
    epics: epicsResult.data ?? [],
    milestones: milestonesResult.data ?? [],
  });
};
