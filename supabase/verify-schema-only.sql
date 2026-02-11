-- Schema Verification (without seed data)
-- Verifies that the migration was applied successfully

-- 1. Check all tables exist
SELECT
    'Tables Exist' as check_name,
    COUNT(*) as expected_count,
    COUNT(*) = 5 as passed
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
AND table_name IN ('projects', 'epics', 'milestones', 'issues', 'dependencies');

-- 2. Check table structures
SELECT
    'Table: projects' as table_check,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'projects'
ORDER BY ordinal_position;

SELECT
    'Table: epics' as table_check,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'epics'
ORDER BY ordinal_position;

SELECT
    'Table: issues' as table_check,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'issues'
ORDER BY ordinal_position;

SELECT
    'Table: milestones' as table_check,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'milestones'
ORDER BY ordinal_position;

SELECT
    'Table: dependencies' as table_check,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'dependencies'
ORDER BY ordinal_position;

-- 3. Check all constraints exist
SELECT
    'Constraints' as check_name,
    conrelid::regclass as table_name,
    conname as constraint_name,
    contype as constraint_type
FROM pg_constraint
WHERE conrelid::regclass::text IN ('projects', 'epics', 'milestones', 'issues', 'dependencies')
ORDER BY conrelid::regclass::text, conname;

-- 4. Check all indexes exist
SELECT
    'Indexes' as check_name,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('projects', 'epics', 'milestones', 'issues', 'dependencies')
ORDER BY tablename, indexname;

-- 5. Check RLS enabled on all tables
SELECT
    'RLS Enabled' as check_name,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('projects', 'epics', 'milestones', 'issues', 'dependencies')
ORDER BY tablename;

-- 6. Check all RLS policies exist
SELECT
    'RLS Policies' as check_name,
    tablename,
    policyname,
    cmd as applies_to
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 7. Check all functions exist
SELECT
    'Functions' as check_name,
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

-- 8. Check all triggers exist
SELECT
    'Triggers' as check_name,
    trigger_name,
    event_object_table as table_name,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name IN (
    'check_dependency_cycle_trigger',
    'create_default_epic_trigger',
    'update_issues_updated_at',
    'ensure_one_default_epic_trigger',
    'validate_sub_issue_project_trigger'
)
ORDER BY event_object_table, trigger_name;

-- Summary
SELECT
    'Schema Verification Summary' as report,
    (SELECT COUNT(*) FROM information_schema.tables
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
     AND table_name IN ('projects', 'epics', 'milestones', 'issues', 'dependencies')) as tables_count,
    (SELECT COUNT(DISTINCT routine_name) FROM information_schema.routines
     WHERE routine_schema = 'public'
     AND routine_name LIKE '%epic%' OR routine_name LIKE '%cycle%' OR routine_name LIKE '%sub_issue%' OR routine_name LIKE '%updated_at%') as functions_count,
    (SELECT COUNT(DISTINCT trigger_name) FROM information_schema.triggers
     WHERE trigger_schema = 'public') as triggers_count,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as policies_count;
