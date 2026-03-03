-- Remove sub-issues feature
-- Delete all sub-issues before dropping the column
DELETE FROM issues WHERE parent_issue_id IS NOT NULL;

-- Drop trigger and function that enforced sub-issue project consistency
DROP TRIGGER IF EXISTS validate_sub_issue_project_trigger ON issues;
DROP FUNCTION IF EXISTS validate_sub_issue_project();

-- Drop index and column
DROP INDEX IF EXISTS idx_issues_parent_issue_id;
ALTER TABLE issues DROP COLUMN IF EXISTS parent_issue_id;
