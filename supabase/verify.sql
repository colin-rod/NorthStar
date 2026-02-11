-- Verification Script for Personal Issue Tracker Schema
-- Run this after applying the seed data to verify everything works

-- ============================================================================
-- 1. Check Tables Exist
-- ============================================================================
SELECT
    'Tables Created' as check_name,
    COUNT(*) as count,
    ARRAY_AGG(table_name ORDER BY table_name) as tables
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
AND table_name IN ('projects', 'epics', 'milestones', 'issues', 'dependencies');

-- Expected: count = 5, tables = {dependencies, epics, issues, milestones, projects}

-- ============================================================================
-- 2. Verify Auto-Created "Unassigned" Epics
-- ============================================================================
SELECT
    'Auto-Created Unassigned Epics' as check_name,
    p.name as project_name,
    e.name as epic_name,
    e.is_default as is_default
FROM projects p
JOIN epics e ON e.project_id = p.id
WHERE e.is_default = TRUE
ORDER BY p.name;

-- Expected: 2 rows, one "Unassigned" epic per project

-- ============================================================================
-- 3. Verify RLS Policies Active
-- ============================================================================
SELECT
    'RLS Policies' as check_name,
    tablename,
    policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Expected: Policies for all 5 tables
-- After migration 002:
--   epics: "Users can access their own epics"
--   issues: "Users can access their own issues"
--   dependencies: "Users can access dependencies for their issues"
--   milestones: "Users can access their own milestones"
--   projects: "Users can access their own projects"

-- ============================================================================
-- 4. Test Blocked/Ready Logic
-- ============================================================================
SELECT
    'Issue Blocking Status' as check_name,
    i.title,
    i.status,
    COUNT(d.depends_on_issue_id) as total_dependencies,
    COUNT(CASE WHEN dep_issue.status NOT IN ('done', 'canceled') THEN 1 END) as blocking_dependencies,
    CASE
        WHEN COUNT(CASE WHEN dep_issue.status NOT IN ('done', 'canceled') THEN 1 END) > 0 THEN 'BLOCKED'
        WHEN i.status = 'todo' AND COUNT(d.depends_on_issue_id) = COUNT(CASE WHEN dep_issue.status IN ('done', 'canceled') THEN 1 END) THEN 'READY'
        ELSE i.status::text
    END as computed_state
FROM issues i
LEFT JOIN dependencies d ON d.issue_id = i.id
LEFT JOIN issues dep_issue ON dep_issue.id = d.depends_on_issue_id
WHERE i.parent_issue_id IS NULL  -- Only show parent issues
GROUP BY i.id, i.title, i.status
ORDER BY i.sort_order;

-- Expected:
--   "Build login UI" should be BLOCKED (depends on "Implement authentication API" which is "doing")
--   "Add permission checks to UI" should be BLOCKED (depends on "Create user roles system" which is "in_review")
--   "Set up CI/CD pipeline" should be READY (no dependencies, status = todo)
--   "Implement dashboard page" should be NOT BLOCKED (depends on "Set up database schema" which is "done")

-- ============================================================================
-- 5. Verify Constraints Working
-- ============================================================================
-- Check story points constraint
SELECT
    'Story Points Values' as check_name,
    story_points,
    COUNT(*) as count
FROM issues
WHERE story_points IS NOT NULL
GROUP BY story_points
ORDER BY story_points;

-- Expected: Only values from {1, 2, 3, 5, 8, 13, 21}

-- Check status enum constraint
SELECT
    'Issue Status Values' as check_name,
    status,
    COUNT(*) as count
FROM issues
GROUP BY status
ORDER BY status;

-- Expected: Only values from {todo, doing, in_review, done, canceled}

-- Check no self-dependencies
SELECT
    'Self-Dependencies Check' as check_name,
    COUNT(*) as count
FROM dependencies
WHERE issue_id = depends_on_issue_id;

-- Expected: count = 0

-- ============================================================================
-- 6. Verify Indexes Created
-- ============================================================================
SELECT
    'Indexes Created' as check_name,
    schemaname,
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('projects', 'epics', 'milestones', 'issues', 'dependencies')
ORDER BY tablename, indexname;

-- Expected: Multiple indexes per table

-- ============================================================================
-- 7. Verify Functions Exist
-- ============================================================================
SELECT
    'Functions Created' as check_name,
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'check_dependency_cycle',
    'update_updated_at_column',
    'prevent_dependency_cycle',
    'create_default_epic',
    'ensure_one_default_epic',
    'validate_sub_issue_project'
)
ORDER BY routine_name;

-- Expected: 6 functions

-- ============================================================================
-- 8. Summary Stats
-- ============================================================================
SELECT
    'Summary Statistics' as report,
    (SELECT COUNT(*) FROM projects) as projects_count,
    (SELECT COUNT(*) FROM epics) as epics_count,
    (SELECT COUNT(*) FROM milestones) as milestones_count,
    (SELECT COUNT(*) FROM issues) as issues_count,
    (SELECT COUNT(*) FROM dependencies) as dependencies_count;

-- Expected: projects=2, epics=7, milestones=3, issues=10, dependencies=4
