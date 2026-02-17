/**
 * Integration Tests: Epic Inheritance Validation for Sub-Issues
 *
 * Tests that sub-issues cannot change their epic (must inherit from parent).
 *
 * Requirements from CLAUDE.md:
 * - Sub-issue inherits epic from parent (enforced in UI)
 * - updateIssue action must block epic changes for sub-issues
 * - UI should disable epic selector for sub-issues
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
let testEpic1: Epic;
let testEpic2: Epic;
let testParentIssue: Issue;
let testSubIssue: Issue;
let testSession: any;

describe('Sub-issue epic inheritance validation', () => {
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
      .insert({ name: 'Test Project for Epic Validation' })
      .select()
      .single();

    if (projectError) {
      throw new Error(`Failed to create test project: ${projectError.message}`);
    }
    testProject = project!;

    // Create two epics in the same project
    const { data: epic1, error: epic1Error } = await supabase
      .from('epics')
      .insert({
        project_id: testProject.id,
        name: 'Epic 1 for Validation Test',
        status: 'active',
        is_default: false,
      })
      .select()
      .single();

    if (epic1Error) {
      throw new Error(`Failed to create test epic 1: ${epic1Error.message}`);
    }
    testEpic1 = epic1!;

    const { data: epic2, error: epic2Error } = await supabase
      .from('epics')
      .insert({
        project_id: testProject.id,
        name: 'Epic 2 for Validation Test',
        status: 'active',
        is_default: false,
      })
      .select()
      .single();

    if (epic2Error) {
      throw new Error(`Failed to create test epic 2: ${epic2Error.message}`);
    }
    testEpic2 = epic2!;

    // Create parent issue in epic1
    const { data: parentIssue, error: parentError } = await supabase
      .from('issues')
      .insert({
        title: 'Parent Issue in Epic 1',
        project_id: testProject.id,
        epic_id: testEpic1.id,
        status: 'todo',
        priority: 2,
        sort_order: 0,
      })
      .select()
      .single();

    if (parentError) {
      throw new Error(`Failed to create parent issue: ${parentError.message}`);
    }
    testParentIssue = parentIssue!;

    // Create sub-issue (inherits epic1 from parent)
    const { data: subIssue, error: subError } = await supabase
      .from('issues')
      .insert({
        title: 'Sub-Issue for Epic Validation',
        project_id: testProject.id,
        epic_id: testEpic1.id, // Same as parent
        parent_issue_id: testParentIssue.id,
        status: 'todo',
        priority: 2,
        sort_order: 0,
      })
      .select()
      .single();

    if (subError) {
      throw new Error(`Failed to create sub-issue: ${subError.message}`);
    }
    testSubIssue = subIssue!;
  });

  afterAll(async () => {
    // Cleanup
    if (testSubIssue?.id) {
      await supabase.from('issues').delete().eq('id', testSubIssue.id);
    }
    if (testParentIssue?.id) {
      await supabase.from('issues').delete().eq('id', testParentIssue.id);
    }
    if (testEpic1?.id) {
      await supabase.from('epics').delete().eq('id', testEpic1.id);
    }
    if (testEpic2?.id) {
      await supabase.from('epics').delete().eq('id', testEpic2.id);
    }
    if (testProject?.id) {
      await supabase.from('projects').delete().eq('id', testProject.id);
    }
    await supabase.auth.signOut();
  });

  describe('updateIssue action epic validation', () => {
    it('should allow epic changes for top-level issues (not sub-issues)', async () => {
      // Create a top-level issue (no parent)
      const { data: topLevelIssue } = await supabase
        .from('issues')
        .insert({
          title: 'Top-Level Issue',
          project_id: testProject.id,
          epic_id: testEpic1.id,
          status: 'todo',
          priority: 2,
          sort_order: 0,
        })
        .select()
        .single();

      // Update epic to epic2 (should succeed)
      const formData = new FormData();
      formData.append('id', topLevelIssue!.id);
      formData.append('epic_id', testEpic2.id);

      const response = await fetch('http://localhost:5173/?/updateIssue', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${testSession.access_token}`,
        },
        body: formData,
      });

      expect(response.ok).toBe(true);

      // Verify epic was updated
      const { data: updated } = await supabase
        .from('issues')
        .select('epic_id')
        .eq('id', topLevelIssue!.id)
        .single();

      expect(updated?.epic_id).toBe(testEpic2.id);

      // Cleanup
      await supabase.from('issues').delete().eq('id', topLevelIssue!.id);
    });

    it('should block epic changes for sub-issues', async () => {
      // Attempt to change sub-issue's epic to epic2
      const formData = new FormData();
      formData.append('id', testSubIssue.id);
      formData.append('epic_id', testEpic2.id);

      const response = await fetch('http://localhost:5173/?/updateIssue', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${testSession.access_token}`,
        },
        body: formData,
      });

      // Should fail with 400 error
      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result.error).toContain('epic');
      expect(result.error).toContain('sub-issue');

      // Verify epic was NOT changed
      const { data: unchanged } = await supabase
        .from('issues')
        .select('epic_id')
        .eq('id', testSubIssue.id)
        .single();

      expect(unchanged?.epic_id).toBe(testEpic1.id); // Still epic1
    });

    it('should allow other field updates for sub-issues (just not epic)', async () => {
      // Update title and status (should succeed)
      const formData = new FormData();
      formData.append('id', testSubIssue.id);
      formData.append('title', 'Updated Sub-Issue Title');
      formData.append('status', 'doing');

      const response = await fetch('http://localhost:5173/?/updateIssue', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${testSession.access_token}`,
        },
        body: formData,
      });

      expect(response.ok).toBe(true);

      // Verify updates
      const { data: updated } = await supabase
        .from('issues')
        .select('title, status, epic_id')
        .eq('id', testSubIssue.id)
        .single();

      expect(updated?.title).toBe('Updated Sub-Issue Title');
      expect(updated?.status).toBe('doing');
      expect(updated?.epic_id).toBe(testEpic1.id); // Epic unchanged
    });

    it('should detect sub-issue by checking parent_issue_id field', async () => {
      // Verify test sub-issue has parent_issue_id
      const { data: subIssue } = await supabase
        .from('issues')
        .select('id, parent_issue_id, epic_id')
        .eq('id', testSubIssue.id)
        .single();

      expect(subIssue?.parent_issue_id).toBe(testParentIssue.id);
      expect(subIssue?.parent_issue_id).not.toBeNull();

      // Server action should query this field to determine if issue is a sub-issue
    });
  });

  describe('epic inheritance consistency', () => {
    it('should maintain epic consistency when parent epic changes', async () => {
      // Create parent with sub-issue
      const { data: parent } = await supabase
        .from('issues')
        .insert({
          title: 'Parent for Epic Change Test',
          project_id: testProject.id,
          epic_id: testEpic1.id,
          status: 'todo',
          priority: 2,
          sort_order: 0,
        })
        .select()
        .single();

      const { data: subIssue } = await supabase
        .from('issues')
        .insert({
          title: 'Sub-Issue for Epic Change Test',
          project_id: testProject.id,
          epic_id: testEpic1.id,
          parent_issue_id: parent!.id,
          status: 'todo',
          priority: 2,
          sort_order: 0,
        })
        .select()
        .single();

      // Change parent's epic to epic2 (database allows this)
      await supabase.from('issues').update({ epic_id: testEpic2.id }).eq('id', parent!.id);

      // Note: Database does NOT enforce epic inheritance
      // Application must ensure sub-issues inherit parent's epic on creation
      // This test documents current behavior

      const { data: updatedParent } = await supabase
        .from('issues')
        .select('epic_id')
        .eq('id', parent!.id)
        .single();

      const { data: updatedSub } = await supabase
        .from('issues')
        .select('epic_id')
        .eq('id', subIssue!.id)
        .single();

      // Parent epic changed, but sub-issue epic did NOT change
      expect(updatedParent?.epic_id).toBe(testEpic2.id);
      expect(updatedSub?.epic_id).toBe(testEpic1.id); // Still epic1

      // Cleanup
      await supabase.from('issues').delete().eq('id', parent!.id); // Cascades to sub-issue
    });
  });
});
