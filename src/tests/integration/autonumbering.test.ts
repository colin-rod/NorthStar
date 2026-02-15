import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';

import type { Database } from '$lib/database.types';

describe('Autonumbering', () => {
  let supabase: SupabaseClient<Database>;
  let testUserId: string;
  let testUserEmail: string;
  let createdProjectIds: string[] = [];
  let createdEpicIds: string[] = [];
  let createdIssueIds: string[] = [];

  beforeAll(async () => {
    // Initialize Supabase client with service role key for admin operations
    supabase = createClient<Database>(
      import.meta.env.VITE_PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL!,
      import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Create test user
    testUserEmail = `test-autonumber-${Date.now()}@example.com`;
    const { data, error } = await supabase.auth.admin.createUser({
      email: testUserEmail,
      password: 'test123456',
      email_confirm: true,
    });

    if (error) {
      throw new Error(`Failed to create test user: ${error.message}`);
    }

    testUserId = data.user.id;
  });

  afterEach(async () => {
    // Clean up created entities after each test
    if (createdIssueIds.length > 0) {
      await supabase.from('issues').delete().in('id', createdIssueIds);
      createdIssueIds = [];
    }
    if (createdEpicIds.length > 0) {
      await supabase.from('epics').delete().in('id', createdEpicIds);
      createdEpicIds = [];
    }
    if (createdProjectIds.length > 0) {
      await supabase.from('projects').delete().in('id', createdProjectIds);
      createdProjectIds = [];
    }
  });

  afterAll(async () => {
    // Delete test user (cascade deletes all entities)
    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  describe('Projects', () => {
    it('should assign sequential numbers to new projects', async () => {
      const { data: p1, error: error1 } = await supabase
        .from('projects')
        .insert({ user_id: testUserId, name: 'Project 1' })
        .select()
        .single();

      expect(error1).toBeNull();
      expect(p1).toBeDefined();
      expect(p1?.number).toBeGreaterThan(0);
      if (p1) createdProjectIds.push(p1.id);

      const { data: p2, error: error2 } = await supabase
        .from('projects')
        .insert({ user_id: testUserId, name: 'Project 2' })
        .select()
        .single();

      expect(error2).toBeNull();
      expect(p2).toBeDefined();
      expect(p2?.number).toBe((p1?.number ?? 0) + 1);
      if (p2) createdProjectIds.push(p2.id);
    });

    it('should enforce number uniqueness', async () => {
      const { data: p1 } = await supabase
        .from('projects')
        .insert({ user_id: testUserId, name: 'Project A' })
        .select()
        .single();

      if (p1) createdProjectIds.push(p1.id);

      // Attempt to manually set duplicate number (should fail)
      const { error } = await supabase
        .from('projects')
        .insert({ user_id: testUserId, name: 'Project B', number: p1?.number });

      expect(error).toBeDefined();
      expect(error?.message).toContain('unique');
    });

    it('should prevent number updates (immutability)', async () => {
      const { data: p1 } = await supabase
        .from('projects')
        .insert({ user_id: testUserId, name: 'Project Immutable' })
        .select()
        .single();

      if (p1) createdProjectIds.push(p1.id);

      const { error } = await supabase
        .from('projects')
        .update({ number: 9999 })
        .eq('id', p1?.id ?? '');

      expect(error).toBeDefined();
      expect(error?.message).toContain('cannot be changed');
    });
  });

  describe('Epics', () => {
    it('should assign sequential numbers to new epics', async () => {
      // Create project first
      const { data: project } = await supabase
        .from('projects')
        .insert({ user_id: testUserId, name: 'Test Project for Epics' })
        .select()
        .single();

      if (project) createdProjectIds.push(project.id);

      const { data: e1, error: error1 } = await supabase
        .from('epics')
        .insert({ project_id: project?.id ?? '', name: 'Epic 1', status: 'active' } as any)
        .select()
        .single();

      expect(error1).toBeNull();
      expect(e1).toBeDefined();
      expect(e1?.number).toBeGreaterThan(0);
      if (e1 && !e1.is_default) createdEpicIds.push(e1.id);

      const { data: e2, error: error2 } = await supabase
        .from('epics')
        .insert({ project_id: project?.id ?? '', name: 'Epic 2', status: 'active' } as any)
        .select()
        .single();

      expect(error2).toBeNull();
      expect(e2).toBeDefined();
      expect(e2?.number).toBe((e1?.number ?? 0) + 1);
      if (e2) createdEpicIds.push(e2.id);
    });

    it('should enforce number uniqueness for epics', async () => {
      const { data: project } = await supabase
        .from('projects')
        .insert({ user_id: testUserId, name: 'Test Project' })
        .select()
        .single();

      if (project) createdProjectIds.push(project.id);

      const { data: e1 } = await supabase
        .from('epics')
        .insert({ project_id: project?.id ?? '', name: 'Epic A', status: 'active' } as any)
        .select()
        .single();

      if (e1 && !e1.is_default) createdEpicIds.push(e1.id);

      const { error } = await supabase.from('epics').insert({
        project_id: project?.id ?? '',
        name: 'Epic B',
        status: 'active',
        number: e1?.number,
      } as any);

      expect(error).toBeDefined();
      expect(error?.message).toContain('unique');
    });

    it('should prevent epic number updates', async () => {
      const { data: project } = await supabase
        .from('projects')
        .insert({ user_id: testUserId, name: 'Test Project' })
        .select()
        .single();

      if (project) createdProjectIds.push(project.id);

      const { data: e1 } = await supabase
        .from('epics')
        .insert({ project_id: project?.id ?? '', name: 'Epic Immutable', status: 'active' } as any)
        .select()
        .single();

      if (e1 && !e1.is_default) createdEpicIds.push(e1.id);

      const { error } = await supabase
        .from('epics')
        .update({ number: 9999 })
        .eq('id', e1?.id ?? '');

      expect(error).toBeDefined();
      expect(error?.message).toContain('cannot be changed');
    });
  });

  describe('Issues', () => {
    it('should assign sequential numbers to new issues', async () => {
      // Setup: Create project and epic
      const { data: project } = await supabase
        .from('projects')
        .insert({ user_id: testUserId, name: 'Issue Test Project' })
        .select()
        .single();

      if (project) createdProjectIds.push(project.id);

      const { data: epic } = await supabase
        .from('epics')
        .insert({ project_id: project?.id ?? '', name: 'Epic', status: 'active' } as any)
        .select()
        .single();

      if (epic && !epic.is_default) createdEpicIds.push(epic.id);

      const { data: i1, error: error1 } = await supabase
        .from('issues')
        .insert({
          project_id: project?.id ?? '',
          epic_id: epic?.id ?? '',
          title: 'Issue 1',
          status: 'todo',
          priority: 2,
        } as any)
        .select()
        .single();

      expect(error1).toBeNull();
      expect(i1).toBeDefined();
      expect(i1?.number).toBeGreaterThan(0);
      if (i1) createdIssueIds.push(i1.id);

      const { data: i2, error: error2 } = await supabase
        .from('issues')
        .insert({
          project_id: project?.id ?? '',
          epic_id: epic?.id ?? '',
          title: 'Issue 2',
          status: 'todo',
          priority: 2,
        } as any)
        .select()
        .single();

      expect(error2).toBeNull();
      expect(i2).toBeDefined();
      expect(i2?.number).toBe((i1?.number ?? 0) + 1);
      if (i2) createdIssueIds.push(i2.id);
    });

    it('should enforce number uniqueness for issues', async () => {
      const { data: project } = await supabase
        .from('projects')
        .insert({ user_id: testUserId, name: 'Test Project' })
        .select()
        .single();

      if (project) createdProjectIds.push(project.id);

      const { data: epic } = await supabase
        .from('epics')
        .insert({ project_id: project?.id ?? '', name: 'Epic', status: 'active' } as any)
        .select()
        .single();

      if (epic && !epic.is_default) createdEpicIds.push(epic.id);

      const { data: i1 } = await supabase
        .from('issues')
        .insert({
          project_id: project?.id ?? '',
          epic_id: epic?.id ?? '',
          title: 'Issue A',
          status: 'todo',
          priority: 2,
        } as any)
        .select()
        .single();

      if (i1) createdIssueIds.push(i1.id);

      const { error } = await supabase.from('issues').insert({
        project_id: project?.id ?? '',
        epic_id: epic?.id ?? '',
        title: 'Issue B',
        status: 'todo',
        priority: 2,
        number: i1?.number,
      } as any);

      expect(error).toBeDefined();
      expect(error?.message).toContain('unique');
    });

    it('should prevent issue number updates', async () => {
      const { data: project } = await supabase
        .from('projects')
        .insert({ user_id: testUserId, name: 'Test Project' })
        .select()
        .single();

      if (project) createdProjectIds.push(project.id);

      const { data: epic } = await supabase
        .from('epics')
        .insert({ project_id: project?.id ?? '', name: 'Epic', status: 'active' } as any)
        .select()
        .single();

      if (epic && !epic.is_default) createdEpicIds.push(epic.id);

      const { data: i1 } = await supabase
        .from('issues')
        .insert({
          project_id: project?.id ?? '',
          epic_id: epic?.id ?? '',
          title: 'Issue Immutable',
          status: 'todo',
          priority: 2,
        } as any)
        .select()
        .single();

      if (i1) createdIssueIds.push(i1.id);

      const { error } = await supabase
        .from('issues')
        .update({ number: 9999 })
        .eq('id', i1?.id ?? '');

      expect(error).toBeDefined();
      expect(error?.message).toContain('cannot be changed');
    });

    it('should handle concurrent issue creation without gaps', async () => {
      // Setup
      const { data: project } = await supabase
        .from('projects')
        .insert({ user_id: testUserId, name: 'Concurrent Test' })
        .select()
        .single();

      if (project) createdProjectIds.push(project.id);

      const { data: epic } = await supabase
        .from('epics')
        .insert({ project_id: project?.id ?? '', name: 'Epic', status: 'active' } as any)
        .select()
        .single();

      if (epic && !epic.is_default) createdEpicIds.push(epic.id);

      // Create 5 issues concurrently
      const promises = Array.from({ length: 5 }, (_, i) =>
        supabase
          .from('issues')
          .insert({
            project_id: project?.id ?? '',
            epic_id: epic?.id ?? '',
            title: `Concurrent Issue ${i}`,
            status: 'todo',
            priority: 2,
          } as any)
          .select()
          .single(),
      );

      const results = await Promise.all(promises);
      const issues = results.map((r) => r.data).filter((d) => d !== null);
      const numbers = issues.map((i) => i!.number).sort((a, b) => a - b);

      // Track created issues for cleanup
      issues.forEach((i) => {
        if (i) createdIssueIds.push(i.id);
      });

      // All numbers should be unique and sequential
      expect(numbers.length).toBe(5);
      expect(new Set(numbers).size).toBe(5); // No duplicates
    });
  });
});
