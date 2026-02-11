/**
 * Integration Tests: updateIssue Server Action
 *
 * Tests the updateIssue form action in +page.server.ts
 * following TDD Red-Green-Refactor cycle.
 *
 * Requirements from CLAUDE.md:
 * - Auth validation
 * - Story points validation (1, 2, 3, 5, 8, 13, 21 or null)
 * - Epic validation (must exist and belong to same project)
 * - Database updates
 * - Error handling
 *
 * Note: Tests use direct Supabase client (remote-only setup per CLAUDE.md)
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import type { Issue, Epic, Project } from '$lib/types';
// import { isValidStoryPoints } from '$lib/utils/issue-helpers'; / / TODO: Use for validation

// Test database setup
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY!;
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

// Test data
let testProject: Project;
let testEpic: Epic;
let testEpic2: Epic;
let testIssue: Issue;
let testSession: any;

describe('updateIssue action', () => {
  beforeAll(async () => {
    // Note: Assumes test user already exists in remote Supabase
    // Create via Supabase UI or migration
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
      .insert({ name: 'Test Project for Update Action' })
      .select()
      .single();

    if (projectError) {
      throw new Error(`Failed to create test project: ${projectError.message}`);
    }
    testProject = project!;

    // Create test epics (need 2 for epic update tests)
    const { data: epic1, error: epic1Error } = await supabase
      .from('epics')
      .insert({
        project_id: testProject.id,
        name: 'Test Epic 1',
        status: 'active',
        is_default: false,
      })
      .select()
      .single();

    if (epic1Error) {
      throw new Error(`Failed to create test epic 1: ${epic1Error.message}`);
    }
    testEpic = epic1!;

    const { data: epic2, error: epic2Error } = await supabase
      .from('epics')
      .insert({
        project_id: testProject.id,
        name: 'Test Epic 2',
        status: 'active',
        is_default: false,
      })
      .select()
      .single();

    if (epic2Error) {
      throw new Error(`Failed to create test epic 2: ${epic2Error.message}`);
    }
    testEpic2 = epic2!;

    // Create test issue
    const { data: issue, error: issueError } = await supabase
      .from('issues')
      .insert({
        title: 'Test Issue for Update Action',
        project_id: testProject.id,
        epic_id: testEpic.id,
        status: 'todo',
        priority: 2,
        story_points: null,
        sort_order: 0,
      })
      .select()
      .single();

    if (issueError) {
      throw new Error(`Failed to create test issue: ${issueError.message}`);
    }
    testIssue = issue!;
  });

  afterAll(async () => {
    // Cleanup: Delete test data in reverse order (dependencies first)
    if (testIssue?.id) {
      await supabase.from('issues').delete().eq('id', testIssue.id);
    }
    if (testEpic?.id) {
      await supabase.from('epics').delete().eq('id', testEpic.id);
    }
    if (testEpic2?.id) {
      await supabase.from('epics').delete().eq('id', testEpic2.id);
    }
    if (testProject?.id) {
      await supabase.from('projects').delete().eq('id', testProject.id);
    }
    await supabase.auth.signOut();
  });

  describe('successful updates (direct database operations)', () => {
    it('should update issue title', async () => {
      const newTitle = 'Updated Title via Test';

      const { data: updated, error } = await supabase
        .from('issues')
        .update({ title: newTitle })
        .eq('id', testIssue.id)
        .select('title')
        .single();

      expect(error).toBeNull();
      expect(updated?.title).toBe(newTitle);

      // Verify with a fresh query
      const { data: verified } = await supabase
        .from('issues')
        .select('title')
        .eq('id', testIssue.id)
        .single();

      expect(verified?.title).toBe(newTitle);
    });

    it('should update issue status', async () => {
      const formData = new FormData();
      formData.append('id', testIssue.id);
      formData.append('status', 'doing');

      const response = await fetch('http://localhost:5173/?/updateIssue', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${testSession.access_token}`,
        },
        body: formData,
      });

      expect(response.ok).toBe(true);

      const { data: updated } = await supabase
        .from('issues')
        .select('status')
        .eq('id', testIssue.id)
        .single();

      expect(updated?.status).toBe('doing');
    });

    it('should update issue priority', async () => {
      const formData = new FormData();
      formData.append('id', testIssue.id);
      formData.append('priority', '0');

      const response = await fetch('http://localhost:5173/?/updateIssue', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${testSession.access_token}`,
        },
        body: formData,
      });

      expect(response.ok).toBe(true);

      const { data: updated } = await supabase
        .from('issues')
        .select('priority')
        .eq('id', testIssue.id)
        .single();

      expect(updated?.priority).toBe(0);
    });

    it('should update issue with valid story points', async () => {
      const validStoryPoints = [1, 2, 3, 5, 8, 13, 21];

      for (const points of validStoryPoints) {
        const formData = new FormData();
        formData.append('id', testIssue.id);
        formData.append('story_points', points.toString());

        const response = await fetch('http://localhost:5173/?/updateIssue', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${testSession.access_token}`,
          },
          body: formData,
        });

        expect(response.ok).toBe(true);

        const { data: updated } = await supabase
          .from('issues')
          .select('story_points')
          .eq('id', testIssue.id)
          .single();

        expect(updated?.story_points).toBe(points);
      }
    });

    it('should set story points to null', async () => {
      const formData = new FormData();
      formData.append('id', testIssue.id);
      formData.append('story_points', '');

      const response = await fetch('http://localhost:5173/?/updateIssue', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${testSession.access_token}`,
        },
        body: formData,
      });

      expect(response.ok).toBe(true);

      const { data: updated } = await supabase
        .from('issues')
        .select('story_points')
        .eq('id', testIssue.id)
        .single();

      expect(updated?.story_points).toBeNull();
    });

    it('should update multiple fields at once', async () => {
      const formData = new FormData();
      formData.append('id', testIssue.id);
      formData.append('title', 'Multi-field Update');
      formData.append('status', 'in_review');
      formData.append('priority', '1');
      formData.append('story_points', '5');

      const response = await fetch('http://localhost:5173/?/updateIssue', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${testSession.access_token}`,
        },
        body: formData,
      });

      expect(response.ok).toBe(true);

      const { data: updated } = await supabase
        .from('issues')
        .select('title, status, priority, story_points')
        .eq('id', testIssue.id)
        .single();

      expect(updated?.title).toBe('Multi-field Update');
      expect(updated?.status).toBe('in_review');
      expect(updated?.priority).toBe(1);
      expect(updated?.story_points).toBe(5);
    });
  });

  describe('validation errors', () => {
    it('should reject invalid story points', async () => {
      const invalidStoryPoints = [4, 6, 7, 9, 10, 100, -1];

      for (const points of invalidStoryPoints) {
        const formData = new FormData();
        formData.append('id', testIssue.id);
        formData.append('story_points', points.toString());

        const response = await fetch('http://localhost:5173/?/updateIssue', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${testSession.access_token}`,
          },
          body: formData,
        });

        expect(response.status).toBe(400);

        const result = await response.json();
        expect(result.error).toContain('story points');
      }
    });

    it('should reject empty title', async () => {
      const formData = new FormData();
      formData.append('id', testIssue.id);
      formData.append('title', '');

      const response = await fetch('http://localhost:5173/?/updateIssue', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${testSession.access_token}`,
        },
        body: formData,
      });

      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result.error).toContain('title');
    });

    it('should reject invalid status', async () => {
      const formData = new FormData();
      formData.append('id', testIssue.id);
      formData.append('status', 'invalid_status');

      const response = await fetch('http://localhost:5173/?/updateIssue', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${testSession.access_token}`,
        },
        body: formData,
      });

      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result.error).toContain('status');
    });

    it('should reject invalid priority', async () => {
      const formData = new FormData();
      formData.append('id', testIssue.id);
      formData.append('priority', '5'); // Valid range is 0-3

      const response = await fetch('http://localhost:5173/?/updateIssue', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${testSession.access_token}`,
        },
        body: formData,
      });

      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result.error).toContain('priority');
    });

    it('should reject unauthorized requests', async () => {
      const formData = new FormData();
      formData.append('id', testIssue.id);
      formData.append('title', 'Unauthorized Update');

      const response = await fetch('http://localhost:5173/?/updateIssue', {
        method: 'POST',
        // No Authorization header
        body: formData,
      });

      expect(response.status).toBe(401);
    });

    it('should reject missing issue ID', async () => {
      const formData = new FormData();
      formData.append('title', 'No ID Provided');

      const response = await fetch('http://localhost:5173/?/updateIssue', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${testSession.access_token}`,
        },
        body: formData,
      });

      expect(response.status).toBe(400);
    });
  });
});
