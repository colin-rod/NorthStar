/**
 * Integration Tests: createIssue Server Action for Sub-Issues
 *
 * Tests the createIssue form action in epics/[id]/+page.server.ts
 * with parent_issue_id to create sub-issues.
 *
 * Requirements from CLAUDE.md:
 * - Sub-issue must be in same project as parent
 * - Sub-issue inherits epic from parent (enforced in UI)
 * - Sort order scoped to parent's sub-issues
 * - Database trigger validates project consistency
 *
 * TDD: RED phase - These tests will fail until implementation is complete
 *
 * Note: Tests use direct Supabase client (remote-only setup per CLAUDE.md)
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import type { Issue, Epic, Project } from '$lib/types';

// Test database setup
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY!;
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

// Test data
let testProject: Project;
let testEpic: Epic;
let testParentIssue: Issue;
let testSession: any;

describe('createIssue action with parent_issue_id (sub-issues)', () => {
  beforeAll(async () => {
    // Sign in test user
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: process.env.TEST_USER_EMAIL || 'test@northstar.com',
      password: process.env.TEST_USER_PASSWORD || 'testpassword123',
    });

    if (signInError) {
      throw new Error(`Failed to sign in test user: ${signInError.message}`);
    }

    testSession = signInData.session;

    // Create test project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({ name: 'Test Project for Sub-Issue Creation' })
      .select()
      .single();

    if (projectError) {
      throw new Error(`Failed to create test project: ${projectError.message}`);
    }
    testProject = project!;

    // Create test epic
    const { data: epic, error: epicError } = await supabase
      .from('epics')
      .insert({
        project_id: testProject.id,
        name: 'Test Epic for Sub-Issues',
        status: 'active',
        is_default: false,
      })
      .select()
      .single();

    if (epicError) {
      throw new Error(`Failed to create test epic: ${epicError.message}`);
    }
    testEpic = epic!;

    // Create parent issue
    const { data: issue, error: issueError } = await supabase
      .from('issues')
      .insert({
        title: 'Parent Issue for Sub-Issue Tests',
        project_id: testProject.id,
        epic_id: testEpic.id,
        status: 'todo',
        priority: 2,
        sort_order: 0,
      })
      .select()
      .single();

    if (issueError) {
      throw new Error(`Failed to create parent issue: ${issueError.message}`);
    }
    testParentIssue = issue!;
  });

  afterAll(async () => {
    // Cleanup: Delete test data (CASCADE will delete sub-issues)
    if (testParentIssue?.id) {
      await supabase.from('issues').delete().eq('id', testParentIssue.id);
    }
    if (testEpic?.id) {
      await supabase.from('epics').delete().eq('id', testEpic.id);
    }
    if (testProject?.id) {
      await supabase.from('projects').delete().eq('id', testProject.id);
    }
    await supabase.auth.signOut();
  });

  describe('successful sub-issue creation', () => {
    it('should create sub-issue with parent_issue_id', async () => {
      const { data: subIssue, error } = await supabase
        .from('issues')
        .insert({
          title: 'Test Sub-Issue 1',
          project_id: testProject.id,
          epic_id: testEpic.id,
          parent_issue_id: testParentIssue.id,
          status: 'todo',
          priority: 2,
          sort_order: 0,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(subIssue?.parent_issue_id).toBe(testParentIssue.id);
      expect(subIssue?.epic_id).toBe(testEpic.id);
      expect(subIssue?.project_id).toBe(testProject.id);
    });

    it('should inherit epic from parent when creating sub-issue', async () => {
      // Create sub-issue with parent's epic
      const { data: subIssue, error } = await supabase
        .from('issues')
        .insert({
          title: 'Sub-Issue Inheriting Epic',
          project_id: testProject.id,
          epic_id: testParentIssue.epic_id, // Should inherit parent's epic
          parent_issue_id: testParentIssue.id,
          status: 'todo',
          priority: 2,
          sort_order: 1,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(subIssue?.epic_id).toBe(testParentIssue.epic_id);
    });

    it('should calculate correct sort_order scoped to parent', async () => {
      // Create first sub-issue
      const { data: subIssue1 } = await supabase
        .from('issues')
        .insert({
          title: 'Sub-Issue Sort 1',
          project_id: testProject.id,
          epic_id: testEpic.id,
          parent_issue_id: testParentIssue.id,
          status: 'todo',
          priority: 2,
          sort_order: 0,
        })
        .select()
        .single();

      // Create second sub-issue
      const { data: subIssue2 } = await supabase
        .from('issues')
        .insert({
          title: 'Sub-Issue Sort 2',
          project_id: testProject.id,
          epic_id: testEpic.id,
          parent_issue_id: testParentIssue.id,
          status: 'todo',
          priority: 2,
          sort_order: 1,
        })
        .select()
        .single();

      expect(subIssue1?.sort_order).toBe(0);
      expect(subIssue2?.sort_order).toBe(1);

      // Query all sub-issues to verify ordering
      const { data: subIssues } = await supabase
        .from('issues')
        .select('id, title, sort_order')
        .eq('parent_issue_id', testParentIssue.id)
        .order('sort_order', { ascending: true });

      expect(subIssues).toHaveLength(2);
      expect(subIssues?.[0].sort_order).toBeLessThan(subIssues?.[1].sort_order!);
    });

    it('should query sub-issues using parent_issue_id relation', async () => {
      // Create sub-issue
      const { data: subIssue } = await supabase
        .from('issues')
        .insert({
          title: 'Sub-Issue for Relation Test',
          project_id: testProject.id,
          epic_id: testEpic.id,
          parent_issue_id: testParentIssue.id,
          status: 'todo',
          priority: 2,
          sort_order: 0,
        })
        .select()
        .single();

      // Query parent with sub-issues relation
      const { data: parent } = await supabase
        .from('issues')
        .select(
          `
          *,
          sub_issues:issues!parent_issue_id(
            id,
            title,
            status,
            parent_issue_id
          )
        `,
        )
        .eq('id', testParentIssue.id)
        .single();

      expect(parent?.sub_issues).toBeDefined();
      expect(Array.isArray(parent?.sub_issues)).toBe(true);
      expect(parent?.sub_issues?.length).toBeGreaterThan(0);

      const foundSubIssue = parent?.sub_issues?.find((si: any) => si.id === subIssue?.id);
      expect(foundSubIssue).toBeDefined();
      expect(foundSubIssue?.parent_issue_id).toBe(testParentIssue.id);
    });
  });

  describe('validation and constraints', () => {
    it('should reject sub-issue with different project than parent (database trigger)', async () => {
      // Create a second project
      const { data: otherProject } = await supabase
        .from('projects')
        .insert({ name: 'Other Project' })
        .select()
        .single();

      // Attempt to create sub-issue in different project
      const { error } = await supabase.from('issues').insert({
        title: 'Cross-Project Sub-Issue',
        project_id: otherProject!.id, // Different project!
        epic_id: testEpic.id,
        parent_issue_id: testParentIssue.id,
        status: 'todo',
        priority: 2,
        sort_order: 0,
      });

      // Should fail due to database trigger
      expect(error).not.toBeNull();
      expect(error?.message).toContain('same project');

      // Cleanup
      if (otherProject?.id) {
        await supabase.from('projects').delete().eq('id', otherProject.id);
      }
    });

    it('should reject sub-issue with non-existent parent', async () => {
      const fakeParentId = '00000000-0000-0000-0000-000000000000';

      const { error } = await supabase.from('issues').insert({
        title: 'Sub-Issue with Fake Parent',
        project_id: testProject.id,
        epic_id: testEpic.id,
        parent_issue_id: fakeParentId,
        status: 'todo',
        priority: 2,
        sort_order: 0,
      });

      // Should fail due to foreign key constraint
      expect(error).not.toBeNull();
    });

    it('should cascade delete sub-issues when parent is deleted', async () => {
      // Create parent and sub-issue
      const { data: parent } = await supabase
        .from('issues')
        .insert({
          title: 'Parent for Cascade Test',
          project_id: testProject.id,
          epic_id: testEpic.id,
          status: 'todo',
          priority: 2,
          sort_order: 0,
        })
        .select()
        .single();

      const { data: subIssue } = await supabase
        .from('issues')
        .insert({
          title: 'Sub-Issue for Cascade Test',
          project_id: testProject.id,
          epic_id: testEpic.id,
          parent_issue_id: parent!.id,
          status: 'todo',
          priority: 2,
          sort_order: 0,
        })
        .select()
        .single();

      // Delete parent
      await supabase.from('issues').delete().eq('id', parent!.id);

      // Verify sub-issue was cascade deleted
      const { data: deletedSubIssue } = await supabase
        .from('issues')
        .select()
        .eq('id', subIssue!.id)
        .single();

      expect(deletedSubIssue).toBeNull();
    });
  });

  describe('server action integration (via HTTP)', () => {
    it('should create sub-issue via createIssue action with parent_issue_id', async () => {
      const formData = new FormData();
      formData.append('title', 'Sub-Issue via HTTP Action');
      formData.append('epic_id', testEpic.id);
      formData.append('project_id', testProject.id);
      formData.append('parent_issue_id', testParentIssue.id);

      const response = await fetch(`http://localhost:5173/epics/${testEpic.id}?/createIssue`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${testSession.access_token}`,
        },
        body: formData,
      });

      expect(response.ok).toBe(true);

      const result = await response.json();
      expect(result.type).toBe('success');
      expect(result.data?.issue?.parent_issue_id).toBe(testParentIssue.id);
      expect(result.data?.issue?.epic_id).toBe(testEpic.id);
    });

    it('should validate parent exists before creating sub-issue', async () => {
      const fakeParentId = '00000000-0000-0000-0000-000000000000';

      const formData = new FormData();
      formData.append('title', 'Sub-Issue with Fake Parent');
      formData.append('epic_id', testEpic.id);
      formData.append('project_id', testProject.id);
      formData.append('parent_issue_id', fakeParentId);

      const response = await fetch(`http://localhost:5173/epics/${testEpic.id}?/createIssue`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${testSession.access_token}`,
        },
        body: formData,
      });

      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result.error).toContain('Parent issue');
    });
  });
});
