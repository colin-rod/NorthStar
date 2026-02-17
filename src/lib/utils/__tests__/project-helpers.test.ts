import { describe, it, expect } from 'vitest';

import { computeProjectMetrics } from '../project-helpers';

import type { Issue } from '$lib/types';

describe('computeProjectMetrics', () => {
  it('should return zero metrics for empty issue array', () => {
    const result = computeProjectMetrics([]);

    expect(result).toEqual({
      totalIssues: 0,
      activeStoryPoints: 0,
      totalStoryPoints: 0,
    });
  });

  it('should count single issue with story points', () => {
    const issues: Issue[] = [
      {
        id: '1',
        title: 'Test Issue',
        status: 'todo',
        priority: 0,
        story_points: 5,
        project_id: 'proj1',
        epic_id: 'epic1',
        sort_order: 0,
        created_at: new Date().toISOString(),
      } as Issue,
    ];

    const result = computeProjectMetrics(issues);

    expect(result).toEqual({
      totalIssues: 1,
      activeStoryPoints: 5,
      totalStoryPoints: 5,
    });
  });

  it('should handle issues with null story points', () => {
    const issues: Issue[] = [
      {
        id: '1',
        title: 'Issue with points',
        status: 'todo',
        story_points: 5,
      } as Issue,
      {
        id: '2',
        title: 'Issue without points',
        status: 'todo',
        story_points: null,
      } as Issue,
    ];

    const result = computeProjectMetrics(issues);

    expect(result).toEqual({
      totalIssues: 2,
      activeStoryPoints: 5, // Only first issue counted
      totalStoryPoints: 5, // Only first issue counted
    });
  });

  it('should only count todo and doing issues in activeStoryPoints', () => {
    const issues: Issue[] = [
      {
        id: '1',
        title: 'Todo issue',
        status: 'todo',
        story_points: 3,
      } as Issue,
      {
        id: '2',
        title: 'Doing issue',
        status: 'doing',
        story_points: 5,
      } as Issue,
      {
        id: '3',
        title: 'In review issue',
        status: 'in_review',
        story_points: 8,
      } as Issue,
      {
        id: '4',
        title: 'Done issue',
        status: 'done',
        story_points: 13,
      } as Issue,
      {
        id: '5',
        title: 'Canceled issue',
        status: 'canceled',
        story_points: 2,
      } as Issue,
    ];

    const result = computeProjectMetrics(issues);

    expect(result).toEqual({
      totalIssues: 5,
      activeStoryPoints: 8, // 3 (todo) + 5 (doing)
      totalStoryPoints: 31, // 3 + 5 + 8 + 13 + 2
    });
  });

  it('should include all non-null story points in totalStoryPoints regardless of status', () => {
    const issues: Issue[] = [
      {
        id: '1',
        title: 'Done issue',
        status: 'done',
        story_points: 13,
      } as Issue,
      {
        id: '2',
        title: 'Canceled issue',
        status: 'canceled',
        story_points: 8,
      } as Issue,
      {
        id: '3',
        title: 'In review issue',
        status: 'in_review',
        story_points: 5,
      } as Issue,
    ];

    const result = computeProjectMetrics(issues);

    expect(result).toEqual({
      totalIssues: 3,
      activeStoryPoints: 0, // No todo/doing issues
      totalStoryPoints: 26, // 13 + 8 + 5
    });
  });

  it('should return zero activeStoryPoints when all issues are done', () => {
    const issues: Issue[] = [
      {
        id: '1',
        title: 'Done issue 1',
        status: 'done',
        story_points: 5,
      } as Issue,
      {
        id: '2',
        title: 'Done issue 2',
        status: 'done',
        story_points: 8,
      } as Issue,
    ];

    const result = computeProjectMetrics(issues);

    expect(result).toEqual({
      totalIssues: 2,
      activeStoryPoints: 0,
      totalStoryPoints: 13,
    });
  });

  it('should handle mixed issues with some null story points and different statuses', () => {
    const issues: Issue[] = [
      {
        id: '1',
        title: 'Todo with points',
        status: 'todo',
        story_points: 3,
      } as Issue,
      {
        id: '2',
        title: 'Todo without points',
        status: 'todo',
        story_points: null,
      } as Issue,
      {
        id: '3',
        title: 'Doing with points',
        status: 'doing',
        story_points: 5,
      } as Issue,
      {
        id: '4',
        title: 'Done with points',
        status: 'done',
        story_points: 8,
      } as Issue,
      {
        id: '5',
        title: 'Done without points',
        status: 'done',
        story_points: null,
      } as Issue,
    ];

    const result = computeProjectMetrics(issues);

    expect(result).toEqual({
      totalIssues: 5,
      activeStoryPoints: 8, // 3 (todo) + 5 (doing)
      totalStoryPoints: 16, // 3 + 5 + 8
    });
  });

  it('should count issues correctly even when all have null story points', () => {
    const issues: Issue[] = [
      {
        id: '1',
        title: 'Todo without points',
        status: 'todo',
        story_points: null,
      } as Issue,
      {
        id: '2',
        title: 'Doing without points',
        status: 'doing',
        story_points: null,
      } as Issue,
      {
        id: '3',
        title: 'Done without points',
        status: 'done',
        story_points: null,
      } as Issue,
    ];

    const result = computeProjectMetrics(issues);

    expect(result).toEqual({
      totalIssues: 3,
      activeStoryPoints: 0,
      totalStoryPoints: 0,
    });
  });
});
