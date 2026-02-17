import { describe, it, expect } from 'vitest';

import { computeIssueCounts, computeProgress } from '../issue-counts';

import type { Issue } from '$lib/types';

describe('computeIssueCounts', () => {
  it('should return all zeros for empty issue array', () => {
    const result = computeIssueCounts([]);

    expect(result).toEqual({
      ready: 0,
      blocked: 0,
      doing: 0,
      inReview: 0,
      done: 0,
      canceled: 0,
    });
  });

  it('should count single todo issue as ready (not blocked)', () => {
    const issues: Issue[] = [
      {
        id: '1',
        title: 'Todo issue',
        status: 'todo',
        priority: 0,
        dependencies: [],
      } as unknown as Issue,
    ];

    const result = computeIssueCounts(issues);

    expect(result).toEqual({
      ready: 1,
      blocked: 0,
      doing: 0,
      inReview: 0,
      done: 0,
      canceled: 0,
    });
  });

  it('should count single blocked issue (has incomplete dependencies)', () => {
    const issues: Issue[] = [
      {
        id: '1',
        title: 'Blocked issue',
        status: 'todo',
        priority: 0,
        dependencies: [
          {
            issue_id: '1',
            depends_on_issue_id: '2',
            depends_on_issue: {
              id: '2',
              title: 'Blocker',
              status: 'todo', // Not done/canceled, so issue 1 is blocked
            },
          },
        ],
      } as unknown as Issue,
    ];

    const result = computeIssueCounts(issues);

    expect(result).toEqual({
      ready: 0, // Blocked issues don't count as ready
      blocked: 1,
      doing: 0,
      inReview: 0,
      done: 0,
      canceled: 0,
    });
  });

  it('should not count blocked issues in their status bucket (EXCLUSIVE rule)', () => {
    const issues: Issue[] = [
      {
        id: '1',
        title: 'Blocked todo issue',
        status: 'todo',
        priority: 0,
        dependencies: [
          {
            issue_id: '1',
            depends_on_issue_id: '2',
            depends_on_issue: {
              id: '2',
              title: 'Blocker',
              status: 'doing',
            },
          },
        ],
      } as unknown as Issue,
      {
        id: '2',
        title: 'Blocked doing issue',
        status: 'doing',
        priority: 0,
        dependencies: [
          {
            issue_id: '2',
            depends_on_issue_id: '3',
            depends_on_issue: {
              id: '3',
              title: 'Blocker',
              status: 'in_review',
            },
          },
        ],
      } as unknown as Issue,
    ];

    const result = computeIssueCounts(issues);

    expect(result).toEqual({
      ready: 0,
      blocked: 2, // Both issues are blocked
      doing: 0, // Blocked issue doesn't count in 'doing'
      inReview: 0,
      done: 0,
      canceled: 0,
    });
  });

  it('should count all 5 status types correctly (when not blocked)', () => {
    const issues: Issue[] = [
      {
        id: '1',
        title: 'Todo',
        status: 'todo',
        dependencies: [],
      } as unknown as Issue,
      {
        id: '2',
        title: 'Doing',
        status: 'doing',
        dependencies: [],
      } as unknown as Issue,
      {
        id: '3',
        title: 'In Review',
        status: 'in_review',
        dependencies: [],
      } as unknown as Issue,
      {
        id: '4',
        title: 'Done',
        status: 'done',
        dependencies: [],
      } as unknown as Issue,
      {
        id: '5',
        title: 'Canceled',
        status: 'canceled',
        dependencies: [],
      } as unknown as Issue,
    ];

    const result = computeIssueCounts(issues);

    expect(result).toEqual({
      ready: 1,
      blocked: 0,
      doing: 1,
      inReview: 1,
      done: 1,
      canceled: 1,
    });
  });

  it('should handle mixed blocked and unblocked issues', () => {
    const issues: Issue[] = [
      {
        id: '1',
        title: 'Ready todo',
        status: 'todo',
        dependencies: [],
      } as unknown as Issue,
      {
        id: '2',
        title: 'Blocked todo',
        status: 'todo',
        dependencies: [
          {
            issue_id: '2',
            depends_on_issue_id: '3',
            depends_on_issue: {
              id: '3',
              title: 'Blocker',
              status: 'todo',
            },
          },
        ],
      } as unknown as Issue,
      {
        id: '4',
        title: 'Unblocked doing',
        status: 'doing',
        dependencies: [],
      } as unknown as Issue,
    ];

    const result = computeIssueCounts(issues);

    expect(result).toEqual({
      ready: 1, // Only issue 1
      blocked: 1, // Only issue 2
      doing: 1, // Only issue 4
      inReview: 0,
      done: 0,
      canceled: 0,
    });
  });

  it('should not count issue as blocked if dependencies are done or canceled', () => {
    const issues: Issue[] = [
      {
        id: '1',
        title: 'Todo with done dependency',
        status: 'todo',
        dependencies: [
          {
            issue_id: '1',
            depends_on_issue_id: '2',
            depends_on_issue: {
              id: '2',
              title: 'Done blocker',
              status: 'done',
            },
          },
        ],
      } as unknown as Issue,
      {
        id: '3',
        title: 'Todo with canceled dependency',
        status: 'todo',
        dependencies: [
          {
            issue_id: '3',
            depends_on_issue_id: '4',
            depends_on_issue: {
              id: '4',
              title: 'Canceled blocker',
              status: 'canceled',
            },
          },
        ],
      } as unknown as Issue,
    ];

    const result = computeIssueCounts(issues);

    expect(result).toEqual({
      ready: 2, // Both issues are ready (dependencies satisfied)
      blocked: 0,
      doing: 0,
      inReview: 0,
      done: 0,
      canceled: 0,
    });
  });

  it('should handle multiple issues with same status', () => {
    const issues: Issue[] = [
      {
        id: '1',
        title: 'Done 1',
        status: 'done',
        dependencies: [],
      } as unknown as Issue,
      {
        id: '2',
        title: 'Done 2',
        status: 'done',
        dependencies: [],
      } as unknown as Issue,
      {
        id: '3',
        title: 'Done 3',
        status: 'done',
        dependencies: [],
      } as unknown as Issue,
    ];

    const result = computeIssueCounts(issues);

    expect(result).toEqual({
      ready: 0,
      blocked: 0,
      doing: 0,
      inReview: 0,
      done: 3,
      canceled: 0,
    });
  });
});

describe('computeProgress', () => {
  it('should return 0% for empty counts (no issues)', () => {
    const counts = {
      ready: 0,
      blocked: 0,
      doing: 0,
      inReview: 0,
      done: 0,
      canceled: 0,
    };

    const result = computeProgress(counts);

    expect(result).toEqual({
      completed: 0,
      total: 0,
      percentage: 0,
    });
  });

  it('should return 100% when all issues are done/canceled', () => {
    const counts = {
      ready: 0,
      blocked: 0,
      doing: 0,
      inReview: 0,
      done: 3,
      canceled: 2,
    };

    const result = computeProgress(counts);

    expect(result).toEqual({
      completed: 5, // 3 done + 2 canceled
      total: 5,
      percentage: 100,
    });
  });

  it('should calculate partial completion correctly', () => {
    const counts = {
      ready: 2,
      blocked: 1,
      doing: 1,
      inReview: 1,
      done: 3,
      canceled: 2,
    };

    const result = computeProgress(counts);

    expect(result).toEqual({
      completed: 5, // 3 done + 2 canceled
      total: 10, // 2 + 1 + 1 + 1 + 3 + 2
      percentage: 50, // 5/10 = 50%
    });
  });

  it('should round percentage to nearest integer', () => {
    const counts = {
      ready: 2,
      blocked: 0,
      doing: 0,
      inReview: 0,
      done: 1,
      canceled: 0,
    };

    const result = computeProgress(counts);

    expect(result).toEqual({
      completed: 1,
      total: 3,
      percentage: 33, // 1/3 = 33.33... → 33
    });
  });

  it('should handle 0% completion (no done/canceled)', () => {
    const counts = {
      ready: 3,
      blocked: 2,
      doing: 1,
      inReview: 1,
      done: 0,
      canceled: 0,
    };

    const result = computeProgress(counts);

    expect(result).toEqual({
      completed: 0,
      total: 7,
      percentage: 0,
    });
  });

  it('should treat done and canceled as completed', () => {
    const counts = {
      ready: 0,
      blocked: 0,
      doing: 0,
      inReview: 0,
      done: 5,
      canceled: 3,
    };

    const result = computeProgress(counts);

    expect(result).toEqual({
      completed: 8, // Both done and canceled count as completed
      total: 8,
      percentage: 100,
    });
  });
});
