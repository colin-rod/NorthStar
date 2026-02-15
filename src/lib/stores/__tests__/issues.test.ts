import { get } from 'svelte/store';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import {
  issues,
  selectedIssue,
  isIssueSheetOpen,
  openIssueSheet,
  openCreateIssueSheet,
  closeIssueSheet,
  updateIssue,
  addIssue,
  removeIssue,
} from '../issues';

import type { Issue } from '$lib/types';

describe('issues store helpers', () => {
  // Reset stores before each test
  beforeEach(() => {
    issues.set([]);
    selectedIssue.set(null);
    isIssueSheetOpen.set(false);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('openIssueSheet', () => {
    it('should set selectedIssue to provided issue', () => {
      const issue: Issue = {
        id: '1',
        title: 'Test Issue',
        status: 'todo',
        priority: 0,
      } as Issue;

      openIssueSheet(issue);

      expect(get(selectedIssue)).toEqual(issue);
    });

    it('should set isIssueSheetOpen to true', () => {
      const issue: Issue = {
        id: '1',
        title: 'Test Issue',
        status: 'todo',
        priority: 0,
      } as Issue;

      openIssueSheet(issue);

      expect(get(isIssueSheetOpen)).toBe(true);
    });
  });

  describe('openCreateIssueSheet', () => {
    it('should set selectedIssue to null', () => {
      // Set initial value
      selectedIssue.set({
        id: '1',
        title: 'Existing',
      } as Issue);

      openCreateIssueSheet();

      expect(get(selectedIssue)).toBeNull();
    });

    it('should set isIssueSheetOpen to true', () => {
      openCreateIssueSheet();

      expect(get(isIssueSheetOpen)).toBe(true);
    });
  });

  describe('closeIssueSheet', () => {
    it('should set isIssueSheetOpen to false immediately', () => {
      isIssueSheetOpen.set(true);

      closeIssueSheet();

      expect(get(isIssueSheetOpen)).toBe(false);
    });

    it('should clear selectedIssue after timeout', () => {
      selectedIssue.set({
        id: '1',
        title: 'Test',
      } as Issue);

      closeIssueSheet();

      // selectedIssue should still be set initially
      expect(get(selectedIssue)).not.toBeNull();

      // Advance timers by 300ms
      vi.advanceTimersByTime(300);

      // Now selectedIssue should be cleared
      expect(get(selectedIssue)).toBeNull();
    });

    it('should not clear selectedIssue before timeout', () => {
      selectedIssue.set({
        id: '1',
        title: 'Test',
      } as Issue);

      closeIssueSheet();

      // Advance timers by 200ms (less than 300ms)
      vi.advanceTimersByTime(200);

      // selectedIssue should still be set
      expect(get(selectedIssue)).not.toBeNull();
    });
  });

  describe('updateIssue', () => {
    it('should update existing issue in store', () => {
      const existingIssues: Issue[] = [
        {
          id: '1',
          title: 'Issue 1',
          status: 'todo',
          priority: 0,
        } as Issue,
        {
          id: '2',
          title: 'Issue 2',
          status: 'doing',
          priority: 1,
        } as Issue,
      ];

      issues.set(existingIssues);

      const updatedIssue: Issue = {
        id: '2',
        title: 'Updated Issue 2',
        status: 'done',
        priority: 0,
      } as Issue;

      updateIssue(updatedIssue);

      const result = get(issues);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(existingIssues[0]); // Unchanged
      expect(result[1]).toEqual(updatedIssue); // Updated
    });

    it('should preserve other issues when updating one', () => {
      const existingIssues: Issue[] = [
        {
          id: '1',
          title: 'Issue 1',
        } as Issue,
        {
          id: '2',
          title: 'Issue 2',
        } as Issue,
        {
          id: '3',
          title: 'Issue 3',
        } as Issue,
      ];

      issues.set(existingIssues);

      const updatedIssue: Issue = {
        id: '2',
        title: 'Updated Issue 2',
        status: 'done',
      } as Issue;

      updateIssue(updatedIssue);

      const result = get(issues);
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
      expect(result[1].title).toBe('Updated Issue 2');
      expect(result[2].id).toBe('3');
    });

    it('should handle updating non-existent issue (no-op)', () => {
      const existingIssues: Issue[] = [
        {
          id: '1',
          title: 'Issue 1',
        } as Issue,
      ];

      issues.set(existingIssues);

      const updatedIssue: Issue = {
        id: '999',
        title: 'Non-existent',
      } as Issue;

      updateIssue(updatedIssue);

      const result = get(issues);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });
  });

  describe('addIssue', () => {
    it('should add new issue to the store', () => {
      const newIssue: Issue = {
        id: '1',
        title: 'New Issue',
        status: 'todo',
        priority: 0,
      } as Issue;

      addIssue(newIssue);

      const result = get(issues);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(newIssue);
    });

    it('should append issue to existing list', () => {
      const existingIssues: Issue[] = [
        {
          id: '1',
          title: 'Existing',
        } as Issue,
      ];

      issues.set(existingIssues);

      const newIssue: Issue = {
        id: '2',
        title: 'New',
      } as Issue;

      addIssue(newIssue);

      const result = get(issues);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
    });

    it('should handle adding to empty store', () => {
      issues.set([]);

      const newIssue: Issue = {
        id: '1',
        title: 'First Issue',
      } as Issue;

      addIssue(newIssue);

      const result = get(issues);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(newIssue);
    });
  });

  describe('removeIssue', () => {
    it('should remove issue by ID', () => {
      const existingIssues: Issue[] = [
        {
          id: '1',
          title: 'Issue 1',
        } as Issue,
        {
          id: '2',
          title: 'Issue 2',
        } as Issue,
      ];

      issues.set(existingIssues);

      removeIssue('2');

      const result = get(issues);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should preserve other issues when removing one', () => {
      const existingIssues: Issue[] = [
        {
          id: '1',
          title: 'Issue 1',
        } as Issue,
        {
          id: '2',
          title: 'Issue 2',
        } as Issue,
        {
          id: '3',
          title: 'Issue 3',
        } as Issue,
      ];

      issues.set(existingIssues);

      removeIssue('2');

      const result = get(issues);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('3');
    });

    it('should handle removing non-existent issue (no-op)', () => {
      const existingIssues: Issue[] = [
        {
          id: '1',
          title: 'Issue 1',
        } as Issue,
      ];

      issues.set(existingIssues);

      removeIssue('999');

      const result = get(issues);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should handle removing from empty store', () => {
      issues.set([]);

      removeIssue('1');

      const result = get(issues);
      expect(result).toEqual([]);
    });
  });
});
