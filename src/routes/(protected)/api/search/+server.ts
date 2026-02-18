import { json, redirect } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals: { supabase, session } }) => {
  if (!session) {
    redirect(303, '/auth/login');
  }

  const [issuesResult, epicsResult, milestonesResult] = await Promise.all([
    supabase
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
          id, title, status, priority, sort_order
        )
      `,
      )
      .order('created_at', { ascending: false }),
    supabase.from('epics').select('*').order('sort_order', { ascending: true }),
    supabase.from('milestones').select('*').order('name', { ascending: true }),
  ]);

  return json({
    issues: issuesResult.data ?? [],
    epics: epicsResult.data ?? [],
    milestones: milestonesResult.data ?? [],
  });
};
