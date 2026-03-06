/**
 * Reusable Supabase select fragments for dependency relations.
 * Use template literal interpolation to include these in loader queries.
 */

/**
 * Full dependency display fragment — includes blocked_by and blocking with
 * enough relational data to render dependency chips in the UI.
 */
export const DEPENDENCY_RELATIONS = `
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
`.trim();

/**
 * Minimal dependency fragment — only fetches what is needed to compute
 * blocked state (id + status of dependencies).
 */
export const DEPENDENCY_STATUS_CHECK = `
  dependencies!dependencies_issue_id_fkey(
    depends_on_issue_id,
    depends_on_issue:issues!dependencies_depends_on_issue_id_fkey(id, status)
  )
`.trim();
