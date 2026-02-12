/**
 * Integration Tests: Dependency Cycle Detection
 *
 * Tests the check_dependency_cycle() PostgreSQL function
 * to ensure it correctly detects cycles in the dependency graph.
 *
 * Requirements from CLAUDE.md:
 * - No circular dependencies allowed
 * - check_dependency_cycle() function validates before INSERT
 * - No self-dependencies
 * - Detects both direct and transitive cycles
 *
 * Note: Tests use direct Supabase client (remote-only setup per CLAUDE.md)
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// Test database setup
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY!;
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

// Test data
let testProjectId: string;
let testEpicId: string;
let testIssue1Id: string;
let testIssue2Id: string;
let testIssue3Id: string;

describe('Dependency Cycle Validation (Integration)', () => {
  beforeAll(async () => {
    // Sign in test user
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: process.env.TEST_USER_EMAIL || 'test@northstar.com',
      password: process.env.TEST_USER_PASSWORD || 'testpassword123',
    });

    if (signInError) {
      throw new Error(`Failed to sign in test user: ${signInError.message}`);
    }

    // Create test project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({ name: 'Test Cycle Detection Project' })
      .select()
      .single();

    if (projectError) {
      throw new Error(`Failed to create test project: ${projectError.message}`);
    }
    testProjectId = project!.id;

    // Get default epic (auto-created by trigger)
    const { data: epic, error: epicError } = await supabase
      .from('epics')
      .select()
      .eq('project_id', testProjectId)
      .eq('is_default', true)
      .single();

    if (epicError) {
      throw new Error(`Failed to get default epic: ${epicError.message}`);
    }
    testEpicId = epic!.id;

    // Create test issues
    const { data: issues, error: issuesError } = await supabase
      .from('issues')
      .insert([
        {
          title: 'Issue 1',
          project_id: testProjectId,
          epic_id: testEpicId,
          status: 'todo',
          priority: 2,
        },
        {
          title: 'Issue 2',
          project_id: testProjectId,
          epic_id: testEpicId,
          status: 'todo',
          priority: 2,
        },
        {
          title: 'Issue 3',
          project_id: testProjectId,
          epic_id: testEpicId,
          status: 'todo',
          priority: 2,
        },
      ])
      .select();

    if (issuesError) {
      throw new Error(`Failed to create test issues: ${issuesError.message}`);
    }

    testIssue1Id = issues![0].id;
    testIssue2Id = issues![1].id;
    testIssue3Id = issues![2].id;
  });

  afterAll(async () => {
    // Clean up (CASCADE will delete dependencies, issues, epics)
    const { error } = await supabase.from('projects').delete().eq('id', testProjectId);

    if (error) {
      console.error('Cleanup error:', error);
    }

    await supabase.auth.signOut();
  });

  it('should detect direct cycle (A → B → A)', async () => {
    // Create Issue1 → Issue2
    const { error: insertError } = await supabase.from('dependencies').insert({
      issue_id: testIssue1Id,
      depends_on_issue_id: testIssue2Id,
    });

    expect(insertError).toBeNull();

    // Try to create Issue2 → Issue1 (would create cycle)
    const { data: wouldCycle, error: cycleError } = await supabase.rpc('check_dependency_cycle', {
      new_issue_id: testIssue2Id,
      new_depends_on_id: testIssue1Id,
    });

    expect(cycleError).toBeNull();
    expect(wouldCycle).toBe(true);

    // Clean up
    await supabase
      .from('dependencies')
      .delete()
      .eq('issue_id', testIssue1Id)
      .eq('depends_on_issue_id', testIssue2Id);
  });

  it('should detect transitive cycle (A → B → C → A)', async () => {
    // Create chain: Issue1 → Issue2 → Issue3
    const { error: insertError } = await supabase.from('dependencies').insert([
      { issue_id: testIssue1Id, depends_on_issue_id: testIssue2Id },
      { issue_id: testIssue2Id, depends_on_issue_id: testIssue3Id },
    ]);

    expect(insertError).toBeNull();

    // Try to create Issue3 → Issue1 (would complete cycle)
    const { data: wouldCycle, error: cycleError } = await supabase.rpc('check_dependency_cycle', {
      new_issue_id: testIssue3Id,
      new_depends_on_id: testIssue1Id,
    });

    expect(cycleError).toBeNull();
    expect(wouldCycle).toBe(true);

    // Clean up
    await supabase.from('dependencies').delete().eq('issue_id', testIssue1Id);
    await supabase.from('dependencies').delete().eq('issue_id', testIssue2Id);
  });

  it('should allow valid dependency (no cycle)', async () => {
    // Try to create Issue1 → Issue2 (no cycle)
    const { data: wouldCycle, error: cycleError } = await supabase.rpc('check_dependency_cycle', {
      new_issue_id: testIssue1Id,
      new_depends_on_id: testIssue2Id,
    });

    expect(cycleError).toBeNull();
    expect(wouldCycle).toBe(false);

    // Verify can insert
    const { error: insertError } = await supabase.from('dependencies').insert({
      issue_id: testIssue1Id,
      depends_on_issue_id: testIssue2Id,
    });

    expect(insertError).toBeNull();

    // Clean up
    await supabase
      .from('dependencies')
      .delete()
      .eq('issue_id', testIssue1Id)
      .eq('depends_on_issue_id', testIssue2Id);
  });

  it('should detect self-dependency', async () => {
    // Try to create Issue1 → Issue1
    const { data: wouldCycle, error: cycleError } = await supabase.rpc('check_dependency_cycle', {
      new_issue_id: testIssue1Id,
      new_depends_on_id: testIssue1Id,
    });

    expect(cycleError).toBeNull();
    expect(wouldCycle).toBe(true);
  });

  it('should detect longer transitive cycle (A → B → C → D → A)', async () => {
    // Create a longer chain to test deeper cycle detection
    // First, create Issue 4 for this test
    const { data: issue4, error: issue4Error } = await supabase
      .from('issues')
      .insert({
        title: 'Issue 4',
        project_id: testProjectId,
        epic_id: testEpicId,
        status: 'todo',
        priority: 2,
      })
      .select()
      .single();

    expect(issue4Error).toBeNull();
    const testIssue4Id = issue4!.id;

    // Create chain: Issue1 → Issue2 → Issue3 → Issue4
    const { error: insertError } = await supabase.from('dependencies').insert([
      { issue_id: testIssue1Id, depends_on_issue_id: testIssue2Id },
      { issue_id: testIssue2Id, depends_on_issue_id: testIssue3Id },
      { issue_id: testIssue3Id, depends_on_issue_id: testIssue4Id },
    ]);

    expect(insertError).toBeNull();

    // Try to create Issue4 → Issue1 (would complete cycle)
    const { data: wouldCycle, error: cycleError } = await supabase.rpc('check_dependency_cycle', {
      new_issue_id: testIssue4Id,
      new_depends_on_id: testIssue1Id,
    });

    expect(cycleError).toBeNull();
    expect(wouldCycle).toBe(true);

    // Clean up
    await supabase.from('dependencies').delete().eq('issue_id', testIssue1Id);
    await supabase.from('dependencies').delete().eq('issue_id', testIssue2Id);
    await supabase.from('dependencies').delete().eq('issue_id', testIssue3Id);
    await supabase.from('issues').delete().eq('id', testIssue4Id);
  });
});
