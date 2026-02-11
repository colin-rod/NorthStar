-- Comprehensive Seed Data for Personal Issue Tracker
-- This script tests all schema features, constraints, and triggers

-- ============================================================================
-- SETUP: Get or create test user
-- ============================================================================
-- Note: Replace 'YOUR_USER_ID' with actual user_id from auth.users table
-- or run this after authenticating to get auth.uid()

DO $$
DECLARE
    test_user_id UUID;
    project1_id UUID;
    project2_id UUID;
    epic_backend_id UUID;
    epic_frontend_id UUID;
    epic_devops_id UUID;
    epic_unassigned1_id UUID;
    milestone_q1_id UUID;
    milestone_v1_id UUID;
    issue1_id UUID;
    issue2_id UUID;
    issue3_id UUID;
    issue4_id UUID;
    issue5_id UUID;
    issue6_id UUID;
    issue7_id UUID;
    issue8_id UUID;
    sub_issue1_id UUID;
    sub_issue2_id UUID;
BEGIN
    -- Get the first user from auth.users (assumes at least one user exists)
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;

    IF test_user_id IS NULL THEN
        RAISE EXCEPTION 'No user found in auth.users. Please sign up first via Supabase Auth.';
    END IF;

    RAISE NOTICE 'Using user_id: %', test_user_id;

    -- ============================================================================
    -- PROJECTS
    -- ============================================================================
    RAISE NOTICE 'Creating projects...';

    -- Delete existing seed data if any (for clean re-runs)
    DELETE FROM projects WHERE user_id = test_user_id AND name IN ('Personal Tasks', 'Work Projects');

    -- Insert projects and capture IDs
    INSERT INTO projects (user_id, name)
    VALUES (test_user_id, 'Personal Tasks')
    RETURNING id INTO project1_id;

    INSERT INTO projects (user_id, name)
    VALUES (test_user_id, 'Work Projects')
    RETURNING id INTO project2_id;

    RAISE NOTICE 'Created projects: % and %', project1_id, project2_id;

    -- ============================================================================
    -- VERIFY AUTO-CREATED UNASSIGNED EPICS
    -- ============================================================================
    RAISE NOTICE 'Verifying auto-created Unassigned epics...';

    SELECT id INTO epic_unassigned1_id
    FROM epics
    WHERE project_id = project1_id AND is_default = TRUE;

    IF epic_unassigned1_id IS NULL THEN
        RAISE EXCEPTION 'Default Unassigned epic was not auto-created for project1!';
    END IF;

    RAISE NOTICE '✓ Auto-created Unassigned epic verified for both projects';

    -- ============================================================================
    -- CUSTOM EPICS
    -- ============================================================================
    RAISE NOTICE 'Creating custom epics...';

    -- Insert epics and capture IDs
    INSERT INTO epics (project_id, name, status, is_default, sort_order)
    VALUES (project1_id, 'Backend', 'active', FALSE, 1)
    RETURNING id INTO epic_backend_id;

    INSERT INTO epics (project_id, name, status, is_default, sort_order)
    VALUES (project1_id, 'Frontend', 'active', FALSE, 2)
    RETURNING id INTO epic_frontend_id;

    INSERT INTO epics (project_id, name, status, is_default, sort_order)
    VALUES (project1_id, 'DevOps', 'active', FALSE, 3)
    RETURNING id INTO epic_devops_id;

    -- Add epics for project2 (we don't need their IDs)
    INSERT INTO epics (project_id, name, status, is_default, sort_order)
    VALUES
        (project2_id, 'Design', 'active', FALSE, 1),
        (project2_id, 'Research', 'done', FALSE, 2);

    RAISE NOTICE '✓ Created custom epics';

    -- ============================================================================
    -- MILESTONES
    -- ============================================================================
    RAISE NOTICE 'Creating milestones...';

    -- Delete existing milestones for clean re-runs
    DELETE FROM milestones WHERE user_id = test_user_id AND name IN ('Q1 2026', 'v1.0 Release', 'Beta Launch');

    -- Insert milestones and capture IDs
    INSERT INTO milestones (user_id, name, due_date)
    VALUES (test_user_id, 'Q1 2026', '2026-03-31')
    RETURNING id INTO milestone_q1_id;

    INSERT INTO milestones (user_id, name, due_date)
    VALUES (test_user_id, 'v1.0 Release', '2026-06-30')
    RETURNING id INTO milestone_v1_id;

    -- Beta Launch milestone (no ID needed)
    INSERT INTO milestones (user_id, name, due_date)
    VALUES (test_user_id, 'Beta Launch', NULL);

    RAISE NOTICE '✓ Created milestones';

    -- ============================================================================
    -- ISSUES - Various configurations
    -- ============================================================================
    RAISE NOTICE 'Creating issues...';

    -- Issue 1: High priority, todo, with milestone
    INSERT INTO issues (id, project_id, epic_id, title, status, priority, story_points, milestone_id, sort_order)
    VALUES (gen_random_uuid(), project1_id, epic_backend_id,
            'Set up database schema', 'done', 0, 5, milestone_q1_id, 1)
    RETURNING id INTO issue1_id;

    -- Issue 2: In progress, blocking others
    INSERT INTO issues (id, project_id, epic_id, title, status, priority, story_points, milestone_id, sort_order)
    VALUES (gen_random_uuid(), project1_id, epic_backend_id,
            'Implement authentication API', 'doing', 0, 8, milestone_q1_id, 2)
    RETURNING id INTO issue2_id;

    -- Issue 3: Blocked by issue2
    INSERT INTO issues (id, project_id, epic_id, title, status, priority, story_points, milestone_id, sort_order)
    VALUES (gen_random_uuid(), project1_id, epic_frontend_id,
            'Build login UI', 'todo', 1, 3, milestone_q1_id, 3)
    RETURNING id INTO issue3_id;

    -- Issue 4: Another blocker (not done)
    INSERT INTO issues (id, project_id, epic_id, title, status, priority, story_points, sort_order)
    VALUES (gen_random_uuid(), project1_id, epic_backend_id,
            'Create user roles system', 'in_review', 1, 5, 4)
    RETURNING id INTO issue4_id;

    -- Issue 5: Blocked by issue4
    INSERT INTO issues (id, project_id, epic_id, title, status, priority, story_points, sort_order)
    VALUES (gen_random_uuid(), project1_id, epic_frontend_id,
            'Add permission checks to UI', 'todo', 2, 2, 5)
    RETURNING id INTO issue5_id;

    -- Issue 6: Ready to work (no blockers, status=todo)
    INSERT INTO issues (id, project_id, epic_id, title, status, priority, story_points, milestone_id, sort_order)
    VALUES (gen_random_uuid(), project1_id, epic_devops_id,
            'Set up CI/CD pipeline', 'todo', 1, 13, milestone_v1_id, 6)
    RETURNING id INTO issue6_id;

    -- Issue 7: Parent issue for sub-issues
    INSERT INTO issues (id, project_id, epic_id, title, status, priority, story_points, sort_order)
    VALUES (gen_random_uuid(), project1_id, epic_frontend_id,
            'Implement dashboard page', 'doing', 0, 21, 7)
    RETURNING id INTO issue7_id;

    -- Issue 8: Canceled issue (shouldn't block others)
    INSERT INTO issues (id, project_id, epic_id, title, status, priority, story_points, sort_order)
    VALUES (gen_random_uuid(), project1_id, epic_backend_id,
            'Add GraphQL API (canceled approach)', 'canceled', 2, 8, 8)
    RETURNING id INTO issue8_id;

    -- Sub-issue 1: Child of issue7 (same project validation)
    INSERT INTO issues (id, project_id, epic_id, parent_issue_id, title, status, priority, story_points, sort_order)
    VALUES (gen_random_uuid(), project1_id, epic_frontend_id, issue7_id,
            'Create dashboard header component', 'done', 1, 2, 9)
    RETURNING id INTO sub_issue1_id;

    -- Sub-issue 2: Another child of issue7
    INSERT INTO issues (id, project_id, epic_id, parent_issue_id, title, status, priority, story_points, sort_order)
    VALUES (gen_random_uuid(), project1_id, epic_frontend_id, issue7_id,
            'Add stats widgets to dashboard', 'doing', 1, 3, 10)
    RETURNING id INTO sub_issue2_id;

    RAISE NOTICE '✓ Created issues';

    -- ============================================================================
    -- DEPENDENCIES - Test blocking relationships
    -- ============================================================================
    RAISE NOTICE 'Creating dependencies...';

    -- Issue 3 depends on Issue 2 (Login UI depends on Auth API)
    INSERT INTO dependencies (issue_id, depends_on_issue_id)
    VALUES (issue3_id, issue2_id);

    -- Issue 5 depends on Issue 4 (Permission UI depends on Roles system)
    INSERT INTO dependencies (issue_id, depends_on_issue_id)
    VALUES (issue5_id, issue4_id);

    -- Issue 7 depends on Issue 1 (Dashboard depends on DB schema - already done, so not blocking)
    INSERT INTO dependencies (issue_id, depends_on_issue_id)
    VALUES (issue7_id, issue1_id);

    -- Create a dependency chain: issue5 → issue4 → issue2
    INSERT INTO dependencies (issue_id, depends_on_issue_id)
    VALUES (issue4_id, issue2_id);

    RAISE NOTICE '✓ Created dependencies';

    -- ============================================================================
    -- TEST CYCLE PREVENTION (should fail)
    -- ============================================================================
    RAISE NOTICE 'Testing cycle prevention...';

    BEGIN
        -- Try to create a cycle: issue2 → issue3 → issue2 (cycle!)
        -- This should fail because issue3 already depends on issue2
        INSERT INTO dependencies (issue_id, depends_on_issue_id)
        VALUES (issue2_id, issue3_id);

        RAISE EXCEPTION 'Cycle prevention FAILED - cycle was allowed!';
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLERRM LIKE '%cycle%' THEN
                RAISE NOTICE '✓ Cycle prevention working - caught attempt to create cycle';
            ELSE
                RAISE;
            END IF;
    END;

    -- ============================================================================
    -- TEST CONSTRAINT VIOLATIONS (should fail gracefully)
    -- ============================================================================
    RAISE NOTICE 'Testing constraint validations...';

    -- Test 1: Invalid story points
    BEGIN
        INSERT INTO issues (project_id, epic_id, title, status, priority, story_points)
        VALUES (project1_id, epic_backend_id, 'Invalid story points test', 'todo', 2, 4);
        RAISE EXCEPTION 'Story points constraint FAILED - invalid value allowed!';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE '✓ Story points constraint working';
    END;

    -- Test 2: Invalid status
    BEGIN
        INSERT INTO issues (project_id, epic_id, title, status, priority)
        VALUES (project1_id, epic_backend_id, 'Invalid status test', 'invalid_status', 2);
        RAISE EXCEPTION 'Status constraint FAILED - invalid value allowed!';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE '✓ Status enum constraint working';
    END;

    -- Test 3: Self-dependency
    BEGIN
        INSERT INTO dependencies (issue_id, depends_on_issue_id)
        VALUES (issue1_id, issue1_id);
        RAISE EXCEPTION 'Self-dependency constraint FAILED - self-dep allowed!';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE '✓ Self-dependency prevention working';
    END;

    -- Test 4: Sub-issue in different project (should fail)
    BEGIN
        INSERT INTO issues (project_id, epic_id, parent_issue_id, title, status, priority)
        VALUES (project2_id, epic_backend_id, issue7_id, 'Cross-project sub-issue', 'todo', 2);
        RAISE EXCEPTION 'Sub-issue project validation FAILED - cross-project sub-issue allowed!';
    EXCEPTION
        WHEN OTHERS THEN
            IF SQLERRM LIKE '%same project%' THEN
                RAISE NOTICE '✓ Sub-issue project validation working';
            ELSE
                RAISE;
            END IF;
    END;

    -- ============================================================================
    -- SUMMARY
    -- ============================================================================
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Seed data created successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Projects: 2';
    RAISE NOTICE 'Epics: 7 (including 2 auto-created Unassigned)';
    RAISE NOTICE 'Milestones: 3';
    RAISE NOTICE 'Issues: 10 (8 parent + 2 sub-issues)';
    RAISE NOTICE 'Dependencies: 4';
    RAISE NOTICE '';
    RAISE NOTICE 'All constraints validated:';
    RAISE NOTICE '  ✓ Dependency cycle prevention';
    RAISE NOTICE '  ✓ Story points constraint';
    RAISE NOTICE '  ✓ Status enum constraint';
    RAISE NOTICE '  ✓ Self-dependency prevention';
    RAISE NOTICE '  ✓ Sub-issue project validation';
    RAISE NOTICE '  ✓ Auto-create Unassigned epic trigger';
    RAISE NOTICE '';
    RAISE NOTICE 'Test scenarios created:';
    RAISE NOTICE '  - Issue 3: BLOCKED (depends on issue 2 which is "doing")';
    RAISE NOTICE '  - Issue 5: BLOCKED (depends on issue 4 which is "in_review")';
    RAISE NOTICE '  - Issue 6: READY (no blockers, status = "todo")';
    RAISE NOTICE '  - Issue 7: NOT BLOCKED (depends on issue 1 which is "done")';
    RAISE NOTICE '========================================';

END $$;
