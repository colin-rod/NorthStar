/**
 * Issue Helpers Tests
 *
 * Comprehensive test suite for issue state computation and validation.
 * Target: 100% coverage (critical business logic per CLAUDE.md)
 */

import { describe, it, expect } from 'vitest';

import {
  isBlocked,
  isReady,
  getBlockingDependencies,
  getSatisfiedDependencies,
  isTerminal,
  getStatusColor,
  getPriorityLabel,
  isValidStoryPoints,
  ALLOWED_STORY_POINTS,
  getAllowedStatusTransitions,
} from './issue-helpers';

import type { Issue, Dependency, IssueStatus } from '$lib/types';

// Test fixtures
const createIssue = (
  id: string,
  status: IssueStatus = 'todo',
  dependencies: Dependency[] = [],
): Issue => ({
  id,
  project_id: 'project-1',
  epic_id: 'epic-1',
  parent_issue_id: null,
  milestone_id: null,
  title: `Issue ${id}`,
  status,
  priority: 1,
  story_points: null,
  sort_order: null,
  created_at: '2024-01-01T00:00:00Z',
  dependencies,
});

const createDependencyWithIssue = (dependsOnIssue: Issue): Dependency => ({
  issue_id: 'current-issue',
  depends_on_issue_id: dependsOnIssue.id,
  depends_on_issue: dependsOnIssue,
});

describe('isBlocked', () => {
  it('should return false when issue has no dependencies', () => {
    const issue = createIssue('A', 'todo', []);
    expect(isBlocked(issue)).toBe(false);
  });

  it('should return false when dependencies property is undefined', () => {
    const issue = createIssue('A', 'todo');
    delete issue.dependencies;
    expect(isBlocked(issue)).toBe(false);
  });

  it('should return true when dependency is in todo status', () => {
    const blockingIssue = createIssue('B', 'todo');
    const issue = createIssue('A', 'todo', [createDependencyWithIssue(blockingIssue)]);
    expect(isBlocked(issue)).toBe(true);
  });

  it('should return true when dependency is in doing status', () => {
    const blockingIssue = createIssue('B', 'doing');
    const issue = createIssue('A', 'todo', [createDependencyWithIssue(blockingIssue)]);
    expect(isBlocked(issue)).toBe(true);
  });

  it('should return true when dependency is in in_review status', () => {
    const blockingIssue = createIssue('B', 'in_review');
    const issue = createIssue('A', 'todo', [createDependencyWithIssue(blockingIssue)]);
    expect(isBlocked(issue)).toBe(true);
  });

  it('should return false when dependency is done', () => {
    const blockingIssue = createIssue('B', 'done');
    const issue = createIssue('A', 'todo', [createDependencyWithIssue(blockingIssue)]);
    expect(isBlocked(issue)).toBe(false);
  });

  it('should return false when dependency is canceled', () => {
    const blockingIssue = createIssue('B', 'canceled');
    const issue = createIssue('A', 'todo', [createDependencyWithIssue(blockingIssue)]);
    expect(isBlocked(issue)).toBe(false);
  });

  it('should return false when all dependencies are done or canceled', () => {
    const doneIssue = createIssue('B', 'done');
    const canceledIssue = createIssue('C', 'canceled');
    const issue = createIssue('A', 'todo', [
      createDependencyWithIssue(doneIssue),
      createDependencyWithIssue(canceledIssue),
    ]);
    expect(isBlocked(issue)).toBe(false);
  });

  it('should return true when at least one dependency is blocking', () => {
    const doneIssue = createIssue('B', 'done');
    const blockingIssue = createIssue('C', 'doing');
    const issue = createIssue('A', 'todo', [
      createDependencyWithIssue(doneIssue),
      createDependencyWithIssue(blockingIssue),
    ]);
    expect(isBlocked(issue)).toBe(true);
  });

  it('should return false when dependency issue is undefined', () => {
    const dependency: Dependency = {
      issue_id: 'A',
      depends_on_issue_id: 'B',
      depends_on_issue: undefined,
    };
    const issue = createIssue('A', 'todo', [dependency]);
    expect(isBlocked(issue)).toBe(false);
  });

  it('should handle multiple undefined dependencies', () => {
    const dependencies: Dependency[] = [
      { issue_id: 'A', depends_on_issue_id: 'B', depends_on_issue: undefined },
      { issue_id: 'A', depends_on_issue_id: 'C', depends_on_issue: undefined },
    ];
    const issue = createIssue('A', 'todo', dependencies);
    expect(isBlocked(issue)).toBe(false);
  });
});

describe('isReady', () => {
  it('should return true when status is todo and not blocked', () => {
    const issue = createIssue('A', 'todo', []);
    expect(isReady(issue)).toBe(true);
  });

  it('should return false when status is doing', () => {
    const issue = createIssue('A', 'doing', []);
    expect(isReady(issue)).toBe(false);
  });

  it('should return false when status is in_review', () => {
    const issue = createIssue('A', 'in_review', []);
    expect(isReady(issue)).toBe(false);
  });

  it('should return false when status is done', () => {
    const issue = createIssue('A', 'done', []);
    expect(isReady(issue)).toBe(false);
  });

  it('should return false when status is canceled', () => {
    const issue = createIssue('A', 'canceled', []);
    expect(isReady(issue)).toBe(false);
  });

  it('should return false when status is todo but blocked', () => {
    const blockingIssue = createIssue('B', 'doing');
    const issue = createIssue('A', 'todo', [createDependencyWithIssue(blockingIssue)]);
    expect(isReady(issue)).toBe(false);
  });

  it('should return true when status is todo and all dependencies are done', () => {
    const doneIssue = createIssue('B', 'done');
    const issue = createIssue('A', 'todo', [createDependencyWithIssue(doneIssue)]);
    expect(isReady(issue)).toBe(true);
  });

  it('should return true when status is todo and all dependencies are canceled', () => {
    const canceledIssue = createIssue('B', 'canceled');
    const issue = createIssue('A', 'todo', [createDependencyWithIssue(canceledIssue)]);
    expect(isReady(issue)).toBe(true);
  });
});

describe('getBlockingDependencies', () => {
  it('should return empty array when issue has no dependencies', () => {
    const issue = createIssue('A', 'todo', []);
    expect(getBlockingDependencies(issue)).toEqual([]);
  });

  it('should return empty array when dependencies property is undefined', () => {
    const issue = createIssue('A', 'todo');
    delete issue.dependencies;
    expect(getBlockingDependencies(issue)).toEqual([]);
  });

  it('should return only blocking dependencies (not done/canceled)', () => {
    const todoIssue = createIssue('B', 'todo');
    const doingIssue = createIssue('C', 'doing');
    const doneIssue = createIssue('D', 'done');
    const canceledIssue = createIssue('E', 'canceled');
    const issue = createIssue('A', 'todo', [
      createDependencyWithIssue(todoIssue),
      createDependencyWithIssue(doingIssue),
      createDependencyWithIssue(doneIssue),
      createDependencyWithIssue(canceledIssue),
    ]);
    const blocking = getBlockingDependencies(issue);
    expect(blocking).toHaveLength(2);
    expect(blocking.map((i) => i.id)).toEqual(['B', 'C']);
  });

  it('should return empty array when all dependencies are done', () => {
    const doneIssue = createIssue('B', 'done');
    const issue = createIssue('A', 'todo', [createDependencyWithIssue(doneIssue)]);
    expect(getBlockingDependencies(issue)).toEqual([]);
  });

  it('should return empty array when all dependencies are canceled', () => {
    const canceledIssue = createIssue('B', 'canceled');
    const issue = createIssue('A', 'todo', [createDependencyWithIssue(canceledIssue)]);
    expect(getBlockingDependencies(issue)).toEqual([]);
  });

  it('should include in_review dependencies as blocking', () => {
    const inReviewIssue = createIssue('B', 'in_review');
    const issue = createIssue('A', 'todo', [createDependencyWithIssue(inReviewIssue)]);
    const blocking = getBlockingDependencies(issue);
    expect(blocking).toHaveLength(1);
    expect(blocking[0].id).toBe('B');
  });

  it('should filter out undefined dependency issues', () => {
    const validIssue = createIssue('B', 'doing');
    const dependencies: Dependency[] = [
      createDependencyWithIssue(validIssue),
      { issue_id: 'A', depends_on_issue_id: 'C', depends_on_issue: undefined },
    ];
    const issue = createIssue('A', 'todo', dependencies);
    const blocking = getBlockingDependencies(issue);
    expect(blocking).toHaveLength(1);
    expect(blocking[0].id).toBe('B');
  });
});

describe('getSatisfiedDependencies', () => {
  it('should return empty array when issue has no dependencies', () => {
    const issue = createIssue('A', 'todo', []);
    expect(getSatisfiedDependencies(issue)).toEqual([]);
  });

  it('should return empty array when dependencies property is undefined', () => {
    const issue = createIssue('A', 'todo');
    delete issue.dependencies;
    expect(getSatisfiedDependencies(issue)).toEqual([]);
  });

  it('should return only done and canceled dependencies', () => {
    const todoIssue = createIssue('B', 'todo');
    const doingIssue = createIssue('C', 'doing');
    const doneIssue = createIssue('D', 'done');
    const canceledIssue = createIssue('E', 'canceled');
    const issue = createIssue('A', 'todo', [
      createDependencyWithIssue(todoIssue),
      createDependencyWithIssue(doingIssue),
      createDependencyWithIssue(doneIssue),
      createDependencyWithIssue(canceledIssue),
    ]);
    const satisfied = getSatisfiedDependencies(issue);
    expect(satisfied).toHaveLength(2);
    expect(satisfied.map((i) => i.id)).toEqual(['D', 'E']);
  });

  it('should return empty array when all dependencies are blocking', () => {
    const todoIssue = createIssue('B', 'todo');
    const doingIssue = createIssue('C', 'doing');
    const issue = createIssue('A', 'todo', [
      createDependencyWithIssue(todoIssue),
      createDependencyWithIssue(doingIssue),
    ]);
    expect(getSatisfiedDependencies(issue)).toEqual([]);
  });

  it('should filter out undefined dependency issues', () => {
    const doneIssue = createIssue('B', 'done');
    const dependencies: Dependency[] = [
      createDependencyWithIssue(doneIssue),
      { issue_id: 'A', depends_on_issue_id: 'C', depends_on_issue: undefined },
    ];
    const issue = createIssue('A', 'todo', dependencies);
    const satisfied = getSatisfiedDependencies(issue);
    expect(satisfied).toHaveLength(1);
    expect(satisfied[0].id).toBe('B');
  });

  it('should not include in_review as satisfied', () => {
    const inReviewIssue = createIssue('B', 'in_review');
    const issue = createIssue('A', 'todo', [createDependencyWithIssue(inReviewIssue)]);
    expect(getSatisfiedDependencies(issue)).toEqual([]);
  });
});

describe('isTerminal', () => {
  it('should return true for done status', () => {
    const issue = createIssue('A', 'done');
    expect(isTerminal(issue)).toBe(true);
  });

  it('should return true for canceled status', () => {
    const issue = createIssue('A', 'canceled');
    expect(isTerminal(issue)).toBe(true);
  });

  it('should return false for todo status', () => {
    const issue = createIssue('A', 'todo');
    expect(isTerminal(issue)).toBe(false);
  });

  it('should return false for doing status', () => {
    const issue = createIssue('A', 'doing');
    expect(isTerminal(issue)).toBe(false);
  });

  it('should return false for in_review status', () => {
    const issue = createIssue('A', 'in_review');
    expect(isTerminal(issue)).toBe(false);
  });
});

describe('getStatusColor', () => {
  it('should return secondary for todo', () => {
    expect(getStatusColor('todo')).toBe('secondary');
  });

  it('should return default for doing', () => {
    expect(getStatusColor('doing')).toBe('default');
  });

  it('should return outline for in_review', () => {
    expect(getStatusColor('in_review')).toBe('outline');
  });

  it('should return success for done', () => {
    expect(getStatusColor('done')).toBe('success');
  });

  it('should return destructive for canceled', () => {
    expect(getStatusColor('canceled')).toBe('destructive');
  });

  it('should return secondary for unknown status', () => {
    expect(getStatusColor('unknown')).toBe('secondary');
  });
});

describe('getPriorityLabel', () => {
  it('should return P0 for priority 0', () => {
    expect(getPriorityLabel(0)).toBe('P0');
  });

  it('should return P1 for priority 1', () => {
    expect(getPriorityLabel(1)).toBe('P1');
  });

  it('should return P2 for priority 2', () => {
    expect(getPriorityLabel(2)).toBe('P2');
  });

  it('should return P3 for priority 3', () => {
    expect(getPriorityLabel(3)).toBe('P3');
  });
});

describe('isValidStoryPoints', () => {
  it('should return true for null', () => {
    expect(isValidStoryPoints(null)).toBe(true);
  });

  it('should return true for valid Fibonacci values', () => {
    expect(isValidStoryPoints(1)).toBe(true);
    expect(isValidStoryPoints(2)).toBe(true);
    expect(isValidStoryPoints(3)).toBe(true);
    expect(isValidStoryPoints(5)).toBe(true);
    expect(isValidStoryPoints(8)).toBe(true);
    expect(isValidStoryPoints(13)).toBe(true);
    expect(isValidStoryPoints(21)).toBe(true);
  });

  it('should return false for invalid values', () => {
    expect(isValidStoryPoints(0)).toBe(false);
    expect(isValidStoryPoints(4)).toBe(false);
    expect(isValidStoryPoints(6)).toBe(false);
    expect(isValidStoryPoints(7)).toBe(false);
    expect(isValidStoryPoints(10)).toBe(false);
    expect(isValidStoryPoints(15)).toBe(false);
    expect(isValidStoryPoints(20)).toBe(false);
    expect(isValidStoryPoints(34)).toBe(false);
    expect(isValidStoryPoints(100)).toBe(false);
  });

  it('should return false for negative values', () => {
    expect(isValidStoryPoints(-1)).toBe(false);
    expect(isValidStoryPoints(-5)).toBe(false);
  });
});

describe('ALLOWED_STORY_POINTS', () => {
  it('should contain all valid Fibonacci values', () => {
    expect(ALLOWED_STORY_POINTS).toEqual([1, 2, 3, 5, 8, 13, 21]);
  });
});

describe('getAllowedStatusTransitions', () => {
  it('should return correct transitions from todo', () => {
    const transitions = getAllowedStatusTransitions('todo');
    expect(transitions).toEqual(['doing', 'canceled']);
  });

  it('should return correct transitions from doing', () => {
    const transitions = getAllowedStatusTransitions('doing');
    expect(transitions).toEqual(['in_review', 'todo', 'canceled']);
  });

  it('should return correct transitions from in_review', () => {
    const transitions = getAllowedStatusTransitions('in_review');
    expect(transitions).toEqual(['done', 'doing', 'canceled']);
  });

  it('should return empty array from done (terminal state)', () => {
    const transitions = getAllowedStatusTransitions('done');
    expect(transitions).toEqual([]);
  });

  it('should return correct transitions from canceled (can reopen)', () => {
    const transitions = getAllowedStatusTransitions('canceled');
    expect(transitions).toEqual(['todo']);
  });

  it('should return empty array for unknown status', () => {
    const transitions = getAllowedStatusTransitions('unknown');
    expect(transitions).toEqual([]);
  });
});
