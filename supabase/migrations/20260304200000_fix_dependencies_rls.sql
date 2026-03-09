-- Fix RLS policy on dependencies table to allow access when either
-- issue_id OR depends_on_issue_id belongs to the user.
-- The previous policy only checked issue_id, which caused the `blocking`
-- relationship (queried via depends_on_issue_id foreign key) to return no rows.

DROP POLICY IF EXISTS "Users can access dependencies for their issues" ON dependencies;

CREATE POLICY "Users can access dependencies for their issues" ON dependencies
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM issues
      JOIN projects ON projects.id = issues.project_id
      WHERE (
        issues.id = dependencies.issue_id OR
        issues.id = dependencies.depends_on_issue_id
      )
      AND projects.user_id = auth.uid()
    )
  );
