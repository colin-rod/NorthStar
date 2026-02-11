-- RLS Verification Script for Personal Issue Tracker
-- Tests Row Level Security policies for single-user ownership
-- Issue: 2.2 — RLS policies for single-user ownership (secure-by-default)
--
-- Acceptance Criteria:
--   1. Unauthenticated requests fail
--   2. Authenticated user can CRUD own records
--   3. Another user (test) cannot access your data
--
-- Usage: psql < supabase/verify-rls.sql

\set QUIET on
\set ON_ERROR_STOP on

-- ============================================================================
-- SETUP: Create test users and sample data
-- ============================================================================

DO $$
BEGIN
    -- Clean up any existing test data first
    DELETE FROM dependencies WHERE issue_id IN (
        SELECT id FROM issues WHERE project_id IN (
            SELECT id FROM projects WHERE user_id IN (
                '11111111-1111-1111-1111-111111111111'::uuid,
                '22222222-2222-2222-2222-222222222222'::uuid
            )
        )
    );
    DELETE FROM issues WHERE project_id IN (
        SELECT id FROM projects WHERE user_id IN (
            '11111111-1111-1111-1111-111111111111'::uuid,
            '22222222-2222-2222-2222-222222222222'::uuid
        )
    );
    DELETE FROM epics WHERE project_id IN (
        SELECT id FROM projects WHERE user_id IN (
            '11111111-1111-1111-1111-111111111111'::uuid,
            '22222222-2222-2222-2222-222222222222'::uuid
        )
    );
    DELETE FROM projects WHERE user_id IN (
        '11111111-1111-1111-1111-111111111111'::uuid,
        '22222222-2222-2222-2222-222222222222'::uuid
    );
    DELETE FROM milestones WHERE user_id IN (
        '11111111-1111-1111-1111-111111111111'::uuid,
        '22222222-2222-2222-2222-222222222222'::uuid
    );
    DELETE FROM auth.users WHERE id IN (
        '11111111-1111-1111-1111-111111111111'::uuid,
        '22222222-2222-2222-2222-222222222222'::uuid
    );

    -- Create test users in auth.users
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
    VALUES
        ('11111111-1111-1111-1111-111111111111', 'test1@example.com', 'password', NOW(), NOW(), NOW()),
        ('22222222-2222-2222-2222-222222222222', 'test2@example.com', 'password', NOW(), NOW(), NOW());
END $$;

-- Create test data for user 1
SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

INSERT INTO projects (id, user_id, name)
VALUES ('10000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Test User 1 Project');

INSERT INTO milestones (id, user_id, name, due_date)
VALUES ('10000000-0000-0000-0000-000000000011', '11111111-1111-1111-1111-111111111111', 'Test Milestone 1', '2026-03-01');

-- Note: "Unassigned" epic auto-created by trigger, insert additional epic
INSERT INTO epics (id, project_id, name, status, is_default, sort_order)
VALUES ('10000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000001', 'Test Epic 1', 'active', FALSE, 1);

INSERT INTO issues (id, project_id, epic_id, title, status, priority, story_points, sort_order)
VALUES ('10000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000001',
        (SELECT id FROM epics WHERE name = 'Unassigned' AND project_id = '10000000-0000-0000-0000-000000000001' LIMIT 1),
        'Test Issue 1', 'todo', 1, 3, 1);

-- Create test data for user 2
SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

INSERT INTO projects (id, user_id, name)
VALUES ('20000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Test User 2 Project');

INSERT INTO milestones (id, user_id, name, due_date)
VALUES ('20000000-0000-0000-0000-000000000012', '22222222-2222-2222-2222-222222222222', 'Test Milestone 2', '2026-04-01');

INSERT INTO epics (id, project_id, name, status, is_default, sort_order)
VALUES ('20000000-0000-0000-0000-000000000022', '20000000-0000-0000-0000-000000000002', 'Test Epic 2', 'active', FALSE, 1);

INSERT INTO issues (id, project_id, epic_id, title, status, priority, story_points, sort_order)
VALUES ('20000000-0000-0000-0000-000000000032', '20000000-0000-0000-0000-000000000002',
        (SELECT id FROM epics WHERE name = 'Unassigned' AND project_id = '20000000-0000-0000-0000-000000000002' LIMIT 1),
        'Test Issue 2', 'todo', 1, 5, 1);

-- Reset JWT claim
RESET request.jwt.claim.sub;

\echo ''
\echo '============================================================================'
\echo 'RLS VERIFICATION TESTS'
\echo '============================================================================'
\echo ''

-- ============================================================================
-- TEST 1: Unauthenticated requests fail
-- ============================================================================

\echo 'TEST 1: Unauthenticated Requests (should see 0 rows)'
\echo '--------------------------------------------------------------------'

-- Clear auth context to simulate unauthenticated user
RESET request.jwt.claim.sub;

\echo 'Test 1.1: Unauthed SELECT projects'
SELECT
    'Unauthed SELECT projects' as check_name,
    0 as expected,
    COUNT(*)::integer as actual,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status
FROM projects;

\echo 'Test 1.2: Unauthed SELECT epics'
SELECT
    'Unauthed SELECT epics' as check_name,
    0 as expected,
    COUNT(*)::integer as actual,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status
FROM epics;

\echo 'Test 1.3: Unauthed SELECT milestones'
SELECT
    'Unauthed SELECT milestones' as check_name,
    0 as expected,
    COUNT(*)::integer as actual,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status
FROM milestones;

\echo 'Test 1.4: Unauthed SELECT issues'
SELECT
    'Unauthed SELECT issues' as check_name,
    0 as expected,
    COUNT(*)::integer as actual,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status
FROM issues;

\echo 'Test 1.5: Unauthed SELECT dependencies'
SELECT
    'Unauthed SELECT dependencies' as check_name,
    0 as expected,
    COUNT(*)::integer as actual,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status
FROM dependencies;

\echo ''

-- ============================================================================
-- TEST 2: Authenticated user can CRUD own records
-- ============================================================================

\echo 'TEST 2: Authenticated User Can CRUD Own Records'
\echo '--------------------------------------------------------------------'

-- Set auth context to user 1
SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

\echo 'Test 2.1: User 1 can SELECT own projects'
SELECT
    'User 1 can SELECT own projects' as check_name,
    1 as expected,
    COUNT(*)::integer as actual,
    CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'FAIL' END as status
FROM projects WHERE name = 'Test User 1 Project';

\echo 'Test 2.2: User 1 can SELECT own epics'
SELECT
    'User 1 can SELECT own epics' as check_name,
    2 as expected,  -- Unassigned + Test Epic 1
    COUNT(*)::integer as actual,
    CASE WHEN COUNT(*) = 2 THEN 'PASS' ELSE 'FAIL' END as status
FROM epics WHERE project_id = '10000000-0000-0000-0000-000000000001';

\echo 'Test 2.3: User 1 can SELECT own milestones'
SELECT
    'User 1 can SELECT own milestones' as check_name,
    1 as expected,
    COUNT(*)::integer as actual,
    CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'FAIL' END as status
FROM milestones WHERE name = 'Test Milestone 1';

\echo 'Test 2.4: User 1 can SELECT own issues'
SELECT
    'User 1 can SELECT own issues' as check_name,
    1 as expected,
    COUNT(*)::integer as actual,
    CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'FAIL' END as status
FROM issues WHERE title = 'Test Issue 1';

\echo 'Test 2.5: User 1 can INSERT new project'
DO $$
DECLARE
    insert_count integer;
BEGIN
    INSERT INTO projects (user_id, name) VALUES ('11111111-1111-1111-1111-111111111111', 'User 1 New Project');
    GET DIAGNOSTICS insert_count = ROW_COUNT;
    RAISE NOTICE 'User 1 can INSERT new project: expected=1, actual=%, status=%',
        insert_count, CASE WHEN insert_count = 1 THEN 'PASS' ELSE 'FAIL' END;
END $$;

\echo 'Test 2.6: User 1 can UPDATE own project'
DO $$
DECLARE
    update_count integer;
BEGIN
    UPDATE projects SET name = 'Test User 1 Project (Updated)' WHERE id = '10000000-0000-0000-0000-000000000001';
    GET DIAGNOSTICS update_count = ROW_COUNT;
    RAISE NOTICE 'User 1 can UPDATE own project: expected=1, actual=%, status=%',
        update_count, CASE WHEN update_count = 1 THEN 'PASS' ELSE 'FAIL' END;
END $$;

\echo 'Test 2.7: User 1 can DELETE own milestone'
DO $$
DECLARE
    delete_count integer;
BEGIN
    DELETE FROM milestones WHERE id = '10000000-0000-0000-0000-000000000011';
    GET DIAGNOSTICS delete_count = ROW_COUNT;
    RAISE NOTICE 'User 1 can DELETE own milestone: expected=1, actual=%, status=%',
        delete_count, CASE WHEN delete_count = 1 THEN 'PASS' ELSE 'FAIL' END;
END $$;

\echo ''

-- ============================================================================
-- TEST 3: Another user cannot access your data
-- ============================================================================

\echo 'TEST 3: Cross-User Access Denied'
\echo '--------------------------------------------------------------------'

-- Switch to user 2
SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

\echo 'Test 3.1: User 2 cannot SELECT User 1 projects'
SELECT
    'User 2 cannot SELECT User 1 projects' as check_name,
    0 as expected,
    COUNT(*)::integer as actual,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status
FROM projects WHERE name LIKE 'Test User 1 Project%';

\echo 'Test 3.2: User 2 cannot SELECT User 1 epics'
SELECT
    'User 2 cannot SELECT User 1 epics' as check_name,
    0 as expected,
    COUNT(*)::integer as actual,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status
FROM epics WHERE id = '10000000-0000-0000-0000-000000000021';

\echo 'Test 3.3: User 2 cannot SELECT User 1 issues'
SELECT
    'User 2 cannot SELECT User 1 issues' as check_name,
    0 as expected,
    COUNT(*)::integer as actual,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status
FROM issues WHERE id = '10000000-0000-0000-0000-000000000031';

\echo 'Test 3.4: User 2 cannot UPDATE User 1 project'
DO $$
DECLARE
    update_count integer;
BEGIN
    UPDATE projects SET name = 'Hacked!' WHERE id = '10000000-0000-0000-0000-000000000001';
    GET DIAGNOSTICS update_count = ROW_COUNT;
    RAISE NOTICE 'User 2 cannot UPDATE User 1 project: expected=0, actual=%, status=%',
        update_count, CASE WHEN update_count = 0 THEN 'PASS' ELSE 'FAIL' END;
END $$;

\echo 'Test 3.5: User 2 cannot DELETE User 1 issue'
DO $$
DECLARE
    delete_count integer;
BEGIN
    DELETE FROM issues WHERE id = '10000000-0000-0000-0000-000000000031';
    GET DIAGNOSTICS delete_count = ROW_COUNT;
    RAISE NOTICE 'User 2 cannot DELETE User 1 issue: expected=0, actual=%, status=%',
        delete_count, CASE WHEN delete_count = 0 THEN 'PASS' ELSE 'FAIL' END;
END $$;

\echo 'Test 3.6: User 2 cannot INSERT issue into User 1 project (FK violation expected)'
DO $$
BEGIN
    INSERT INTO issues (project_id, epic_id, title, status, priority, sort_order)
    VALUES (
        '10000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000021',
        'Hacked Issue',
        'todo',
        0,
        100
    );
    RAISE NOTICE 'User 2 cannot INSERT into User 1 project: FAIL (insert succeeded when it should have failed)';
EXCEPTION
    WHEN foreign_key_violation OR check_violation THEN
        RAISE NOTICE 'User 2 cannot INSERT into User 1 project: expected=error, actual=error, status=PASS';
    WHEN OTHERS THEN
        RAISE NOTICE 'User 2 cannot INSERT into User 1 project: expected=error, actual=%, status=PASS', SQLERRM;
END $$;

\echo ''

-- ============================================================================
-- CLEANUP: Remove test data
-- ============================================================================

\echo 'Cleaning up test data...'

-- Reset to superuser context for cleanup
RESET request.jwt.claim.sub;

-- Clean up test data
DELETE FROM dependencies WHERE issue_id IN (
    SELECT id FROM issues WHERE project_id IN (
        SELECT id FROM projects WHERE user_id IN (
            '11111111-1111-1111-1111-111111111111'::uuid,
            '22222222-2222-2222-2222-222222222222'::uuid
        )
    )
);
DELETE FROM issues WHERE project_id IN (
    SELECT id FROM projects WHERE user_id IN (
        '11111111-1111-1111-1111-111111111111'::uuid,
        '22222222-2222-2222-2222-222222222222'::uuid
    )
);
DELETE FROM epics WHERE project_id IN (
    SELECT id FROM projects WHERE user_id IN (
        '11111111-1111-1111-1111-111111111111'::uuid,
        '22222222-2222-2222-2222-222222222222'::uuid
    )
);
DELETE FROM projects WHERE user_id IN (
    '11111111-1111-1111-1111-111111111111'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid
);
DELETE FROM milestones WHERE user_id IN (
    '11111111-1111-1111-1111-111111111111'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid
);
DELETE FROM auth.users WHERE id IN (
    '11111111-1111-1111-1111-111111111111'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid
);

\echo 'Test data cleaned up.'
\echo ''
\echo '============================================================================'
\echo 'RLS VERIFICATION COMPLETE'
\echo '============================================================================'
\echo ''
\echo 'All tests should show PASS status.'
\echo 'If any tests show FAIL, RLS policies are not working correctly.'
\echo ''
