import { redirect } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, session } }) => {
  if (!session) {
    redirect(303, '/auth/login');
  }

  const { data: issues, error } = await supabase
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
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading issues for search:', error);
    return { issues: [], epics: [], milestones: [] };
  }

  // Load all epics for the user (for epic picker in IssueSheet)
  const { data: epics } = await supabase
    .from('epics')
    .select('*')
    .order('sort_order', { ascending: true });

  // Load all milestones for the user (global, cross-project)
  const { data: milestones } = await supabase
    .from('milestones')
    .select('*')
    .order('name', { ascending: true });

  return {
    issues: issues || [],
    epics: epics || [],
    milestones: milestones || [],
  };
};
