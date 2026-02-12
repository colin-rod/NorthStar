import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

/**
 * Integration Test: Dependency Queries (blocked_by and blocking)
 *
 * Tests the new server-side dependency queries that replace client-side filtering.
 * These queries should return:
 * 1. blocked_by: Issues that block the current issue (where issue_id = current)
 * 2. blocking: Issues that the current issue blocks (where depends_on_issue_id = current)
 */

// Test database setup
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY!;
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

describe('Dependency Queries Integration', () => {
  let testProjectId: string;
  let testEpicId: string;
  let issueA: { id: string; title: string };
  let issueB: { id: string; title: string };
  let issueC: { id: string; title: string };

  beforeAll(async () => {
    // Create test project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({ name: 'Test Project - Dependency Queries' })
      .select()
      .single();

    if (projectError || !project) {
      throw new Error('Failed to create test project');
    }
    testProjectId = project.id;

    // Get default epic for project
    const { data: epic, error: epicError } = await supabase
      .from('epics')
      .select('id')
      .eq('project_id', testProjectId)
      .eq('is_default', true)
      .single();

    if (epicError || !epic) {
      throw new Error('Failed to find default epic');
    }
    testEpicId = epic.id;

    // Create test issues:
    // Issue A depends on Issue B (B blocks A)
    // Issue C depends on Issue A (A blocks C)

    // Create Issue B (no dependencies)
    const { data: b, error: bError } = await supabase
      .from('issues')
      .insert({
        project_id: testProjectId,
        epic_id: testEpicId,
        title: 'Issue B - No dependencies',
        status: 'todo',
        priority: 2,
      })
      .select()
      .single();

    if (bError || !b) {
      throw new Error('Failed to create Issue B');
    }
    issueB = b;

    // Create Issue A (depends on B)
    const { data: a, error: aError } = await supabase
      .from('issues')
      .insert({
        project_id: testProjectId,
        epic_id: testEpicId,
        title: 'Issue A - Depends on B',
        status: 'todo',
        priority: 2,
      })
      .select()
      .single();

    if (aError || !a) {
      throw new Error('Failed to create Issue A');
    }
    issueA = a;

    // Create Issue C (depends on A)
    const { data: c, error: cError } = await supabase
      .from('issues')
      .insert({
        project_id: testProjectId,
        epic_id: testEpicId,
        title: 'Issue C - Depends on A',
        status: 'todo',
        priority: 2,
      })
      .select()
      .single();

    if (cError || !c) {
      throw new Error('Failed to create Issue C');
    }
    issueC = c;

    // Add dependency: A depends on B
    await supabase.from('dependencies').insert({
      issue_id: issueA.id,
      depends_on_issue_id: issueB.id,
    });

    // Add dependency: C depends on A
    await supabase.from('dependencies').insert({
      issue_id: issueC.id,
      depends_on_issue_id: issueA.id,
    });
  });

  afterAll(async () => {
    // Clean up test data
    if (testProjectId) {
      await supabase.from('projects').delete().eq('id', testProjectId);
    }
  });

  it('should load blocked_by relationships (issues that block this one)', async () => {
    // Load Issue A with blocked_by query
    const { data: issue, error } = await supabase
      .from('issues')
      .select(
        `
        id,
        title,
        blocked_by:dependencies!dependencies_issue_id_fkey(
          depends_on_issue_id,
          depends_on_issue:issues(
            id,
            title,
            status,
            priority,
            epic_id,
            project_id,
            epic:epics(id, name),
            project:projects(id, name)
          )
        )
      `,
      )
      .eq('id', issueA.id)
      .single();

    expect(error).toBeNull();
    expect(issue).toBeDefined();
    expect(issue?.blocked_by).toHaveLength(1);

    const blockedBy = issue?.blocked_by?.[0];
    expect(blockedBy).toBeDefined();
    const dependsOnIssue = blockedBy?.depends_on_issue as any;
    expect(dependsOnIssue?.id).toBe(issueB.id);
    expect(dependsOnIssue?.title).toBe(issueB.title);
    expect(dependsOnIssue?.epic).toBeDefined();
    expect(dependsOnIssue?.project).toBeDefined();
  });

  it('should load blocking relationships (issues this one blocks)', async () => {
    // Load Issue A with blocking query
    const { data: issue, error } = await supabase
      .from('issues')
      .select(
        `
        id,
        title,
        blocking:dependencies!dependencies_depends_on_issue_id_fkey(
          issue_id,
          issue:issues(
            id,
            title,
            status,
            priority,
            epic_id,
            project_id,
            epic:epics(id, name),
            project:projects(id, name)
          )
        )
      `,
      )
      .eq('id', issueA.id)
      .single();

    expect(error).toBeNull();
    expect(issue).toBeDefined();
    expect(issue?.blocking).toHaveLength(1);

    const blocking = issue?.blocking?.[0];
    expect(blocking).toBeDefined();
    const blockingIssue = blocking?.issue as any;
    expect(blockingIssue?.id).toBe(issueC.id);
    expect(blockingIssue?.title).toBe(issueC.title);
    expect(blockingIssue?.epic).toBeDefined();
    expect(blockingIssue?.project).toBeDefined();
  });

  it('should load both blocked_by and blocking in a single query', async () => {
    // Load Issue A with both queries
    const { data: issue, error } = await supabase
      .from('issues')
      .select(
        `
        id,
        title,
        status,
        blocked_by:dependencies!dependencies_issue_id_fkey(
          depends_on_issue_id,
          depends_on_issue:issues(id, title, status, epic:epics(id, name))
        ),
        blocking:dependencies!dependencies_depends_on_issue_id_fkey(
          issue_id,
          issue:issues(id, title, status, epic:epics(id, name))
        )
      `,
      )
      .eq('id', issueA.id)
      .single();

    expect(error).toBeNull();
    expect(issue).toBeDefined();

    // Verify blocked_by (A depends on B, so B blocks A)
    expect(issue?.blocked_by).toHaveLength(1);
    const blockedByIssue = issue?.blocked_by?.[0]?.depends_on_issue as any;
    expect(blockedByIssue?.id).toBe(issueB.id);

    // Verify blocking (C depends on A, so A blocks C)
    expect(issue?.blocking).toHaveLength(1);
    const blockingIssue = issue?.blocking?.[0]?.issue as any;
    expect(blockingIssue?.id).toBe(issueC.id);
  });

  it('should return empty arrays when issue has no dependencies', async () => {
    // Load Issue B (no dependencies)
    const { data: issue, error } = await supabase
      .from('issues')
      .select(
        `
        id,
        title,
        blocked_by:dependencies!dependencies_issue_id_fkey(
          depends_on_issue_id,
          depends_on_issue:issues(id, title)
        ),
        blocking:dependencies!dependencies_depends_on_issue_id_fkey(
          issue_id,
          issue:issues(id, title)
        )
      `,
      )
      .eq('id', issueB.id)
      .single();

    expect(error).toBeNull();
    expect(issue).toBeDefined();
    expect(issue?.blocked_by).toEqual([]);
    expect(issue?.blocking).toHaveLength(1); // B blocks A
    const blockingIssue = issue?.blocking?.[0]?.issue as any;
    expect(blockingIssue?.id).toBe(issueA.id);
  });
});
