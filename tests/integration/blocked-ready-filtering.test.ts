import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Blocked/Ready Tab Filtering', () => {
  const supabaseUrl = process.env.PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY!;
  const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

  let testProjectId: string;
  let testEpicId: string;
  let readyIssueId: string;
  let blockedIssueId: string;
  let blockingIssueId: string;

  beforeAll(async () => {
    // Sign in test user
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: process.env.TEST_USER_EMAIL || 'test@northstar.com',
      password: process.env.TEST_USER_PASSWORD || 'testpassword123',
    });

    if (signInError) {
      throw new Error(`Failed to sign in test user: ${signInError.message}`);
    }

    // Create test project and epic
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({ name: 'Test - Blocked Ready Filtering' })
      .select()
      .single();

    if (projectError || !project) {
      throw new Error(`Failed to create test project: ${projectError?.message || 'Unknown error'}`);
    }
    testProjectId = project.id;

    const { data: epic, error: epicError } = await supabase
      .from('epics')
      .select('id')
      .eq('project_id', testProjectId)
      .eq('is_default', true)
      .single();

    if (epicError || !epic) {
      throw new Error(`Failed to find default epic: ${epicError?.message || 'Unknown error'}`);
    }
    testEpicId = epic.id;

    // Create ready issue (todo, no deps)
    const { data: readyIssue, error: readyError } = await supabase
      .from('issues')
      .insert({
        title: 'Ready Issue',
        project_id: testProjectId,
        epic_id: testEpicId,
        status: 'todo',
        priority: 0,
      })
      .select()
      .single();

    if (readyError || !readyIssue) {
      throw new Error(`Failed to create ready issue: ${readyError?.message || 'Unknown error'}`);
    }
    readyIssueId = readyIssue.id;

    // Create blocking issue (todo, will be dependency)
    const { data: blockingIssue, error: blockingError } = await supabase
      .from('issues')
      .insert({
        title: 'Blocking Issue',
        project_id: testProjectId,
        epic_id: testEpicId,
        status: 'todo',
        priority: 0,
      })
      .select()
      .single();

    if (blockingError || !blockingIssue) {
      throw new Error(
        `Failed to create blocking issue: ${blockingError?.message || 'Unknown error'}`,
      );
    }
    blockingIssueId = blockingIssue.id;

    // Create blocked issue (todo, depends on blocking issue)
    const { data: blockedIssue, error: blockedError } = await supabase
      .from('issues')
      .insert({
        title: 'Blocked Issue',
        project_id: testProjectId,
        epic_id: testEpicId,
        status: 'todo',
        priority: 0,
      })
      .select()
      .single();

    if (blockedError || !blockedIssue) {
      throw new Error(
        `Failed to create blocked issue: ${blockedError?.message || 'Unknown error'}`,
      );
    }
    blockedIssueId = blockedIssue.id;

    // Create dependency
    await supabase.from('dependencies').insert({
      issue_id: blockedIssueId,
      depends_on_issue_id: blockingIssueId,
    });
  });

  afterAll(async () => {
    // Cleanup
    await supabase.from('projects').delete().eq('id', testProjectId);
  });

  it('should identify ready issue correctly', async () => {
    const { data: issue } = await supabase
      .from('issues')
      .select(
        '*, dependencies!dependencies_issue_id_fkey(depends_on_issue_id, depends_on_issue:issues(*))',
      )
      .eq('id', readyIssueId)
      .single();

    // Issue should be ready: status=todo and no blocking deps
    expect(issue!.status).toBe('todo');
    expect(issue!.dependencies).toHaveLength(0);
  });

  it('should identify blocked issue correctly', async () => {
    const { data: issue } = await supabase
      .from('issues')
      .select(
        '*, dependencies!dependencies_issue_id_fkey(depends_on_issue_id, depends_on_issue:issues(*))',
      )
      .eq('id', blockedIssueId)
      .single();

    // Issue should be blocked: has dependency with status=todo
    expect(issue!.status).toBe('todo');
    expect(issue!.dependencies).toHaveLength(1);
    expect(issue!.dependencies[0].depends_on_issue.status).toBe('todo');
  });

  it('should unblock issue when dependency is marked done', async () => {
    // Mark blocking issue as done
    await supabase.from('issues').update({ status: 'done' }).eq('id', blockingIssueId);

    // Re-fetch blocked issue
    const { data: issue } = await supabase
      .from('issues')
      .select(
        '*, dependencies!dependencies_issue_id_fkey(depends_on_issue_id, depends_on_issue:issues(*))',
      )
      .eq('id', blockedIssueId)
      .single();

    // Issue should now be ready: dependency is done
    expect(issue!.dependencies[0].depends_on_issue.status).toBe('done');
  });
});
