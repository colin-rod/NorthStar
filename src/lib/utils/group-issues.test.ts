// src/lib/utils/group-issues.test.ts
import { describe, it, expect } from 'vitest';

import { groupIssues } from './group-issues';

import type { Issue } from '$lib/types';

describe('groupIssues', () => {
  const mockIssues: Issue[] = [
    {
      id: '1',
      title: 'Issue 1',
      priority: 0,
      status: 'todo',
      story_points: 1,
      milestone_id: 'm1',
      project_id: 'proj-1',
      epic_id: 'epic-1',
      number: 1,
      description: null,
      sort_order: 0,
      created_at: '2024-01-01',
    } as Issue,
    {
      id: '2',
      title: 'Issue 2',
      priority: 0,
      status: 'in_progress',
      story_points: 2,
      milestone_id: 'm1',
      project_id: 'proj-1',
      epic_id: 'epic-1',
      number: 2,
      description: null,
      sort_order: 1,
      created_at: '2024-01-01',
    } as Issue,
    {
      id: '3',
      title: 'Issue 3',
      priority: 1,
      status: 'todo',
      story_points: null,
      milestone_id: null,
      project_id: 'proj-1',
      epic_id: 'epic-1',
      number: 3,
      description: null,
      sort_order: 2,
      created_at: '2024-01-01',
    } as Issue,
  ];

  it('should return ungrouped issues when groupBy is "none"', () => {
    const result = groupIssues(mockIssues, 'none');

    expect(result).toHaveLength(1);
    expect(result[0].items).toHaveLength(3);
    expect(result[0].label).toBeUndefined();
  });

  it('should group by priority', () => {
    const result = groupIssues(mockIssues, 'priority');

    expect(result).toHaveLength(2);
    expect(result[0].label).toBe('P0');
    expect(result[0].items).toHaveLength(2);
    expect(result[1].label).toBe('P1');
    expect(result[1].items).toHaveLength(1);
  });

  it('should group by status', () => {
    const result = groupIssues(mockIssues, 'status');

    expect(result).toHaveLength(2);
    expect(result[0].label).toBe('Todo');
    expect(result[0].items).toHaveLength(2);
    expect(result[1].label).toBe('In Progress');
    expect(result[1].items).toHaveLength(1);
  });

  it('should group by story points', () => {
    const result = groupIssues(mockIssues, 'story_points');

    expect(result).toHaveLength(3);
    expect(result.find((g) => g.label === '1 point')).toBeDefined();
    expect(result.find((g) => g.label === '2 points')).toBeDefined();
    expect(result.find((g) => g.label === 'No story points')).toBeDefined();
  });

  it('should sort groups in sensible order', () => {
    const result = groupIssues(mockIssues, 'priority');

    expect(result[0].label).toBe('P0'); // P0 before P1
    expect(result[1].label).toBe('P1');
  });

  it('should group by milestone', () => {
    const issuesWithMilestones: Issue[] = [
      {
        ...mockIssues[0],
        milestone_id: 'm1',
        milestone: { id: 'm1', user_id: 'user-1', name: 'Sprint 1', due_date: null },
      } as Issue,
      {
        ...mockIssues[1],
        milestone_id: 'm1',
        milestone: { id: 'm1', user_id: 'user-1', name: 'Sprint 1', due_date: null },
      } as Issue,
      {
        ...mockIssues[2],
        milestone_id: null,
      } as Issue,
    ];

    const result = groupIssues(issuesWithMilestones, 'milestone');

    expect(result).toHaveLength(2);
    const sprintGroup = result.find((g) => g.label === 'Sprint 1');
    const noMilestoneGroup = result.find((g) => g.label === 'No milestone');
    expect(sprintGroup).toBeDefined();
    expect(sprintGroup!.items).toHaveLength(2);
    expect(noMilestoneGroup).toBeDefined();
    expect(noMilestoneGroup!.items).toHaveLength(1);
  });

  it('should show "Unknown" for milestone with missing name', () => {
    const issuesWithoutMilestoneName: Issue[] = [
      {
        ...mockIssues[0],
        milestone_id: 'm1',
        milestone: undefined,
      } as Issue,
    ];

    const result = groupIssues(issuesWithoutMilestoneName, 'milestone');

    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('Unknown');
  });

  it('should handle unknown groupBy value', () => {
    const result = groupIssues(mockIssues, 'nonexistent');

    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('Unknown');
  });
});
