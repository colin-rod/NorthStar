/**
 * Issue Helper Functions
 *
 * Business logic for computing issue states.
 *
 * Requirements from CLAUDE.md:
 * - Blocked: Issue has ≥1 dependency with status NOT in (done, canceled)
 * - Ready: Issue status = todo AND NOT blocked
 * - Note: in_review counts as NOT done (still blocks)
 */

import type { Issue } from '$lib/types';

/**
 * Check if an issue is blocked by any dependencies
 *
 * An issue is blocked if it has at least one dependency
 * with status NOT in ['done', 'canceled']
 */
export function isBlocked(issue: Issue): boolean {
  if (!issue.dependencies || issue.dependencies.length === 0) {
    return false;
  }

  // Check if any dependency is not done or canceled
  return issue.dependencies.some((dep) => {
    return (
      dep.depends_on_issue &&
      dep.depends_on_issue.status !== 'done' &&
      dep.depends_on_issue.status !== 'canceled'
    );
  });
}

/**
 * Check if an issue is ready to work on
 *
 * Ready = status is 'todo' AND not blocked
 */
export function isReady(issue: Issue): boolean {
  return issue.status === 'todo' && !isBlocked(issue);
}

/**
 * Get blocking dependencies for an issue
 *
 * Returns only dependencies that are actively blocking (not done/canceled)
 */
export function getBlockingDependencies(issue: Issue): Issue[] {
  if (!issue.dependencies || issue.dependencies.length === 0) {
    return [];
  }

  return issue.dependencies
    .map((dep) => dep.depends_on_issue)
    .filter((dep): dep is Issue => {
      return dep !== undefined && dep.status !== 'done' && dep.status !== 'canceled';
    });
}

/**
 * Get satisfied dependencies for an issue
 *
 * Returns dependencies that are done or canceled
 */
export function getSatisfiedDependencies(issue: Issue): Issue[] {
  if (!issue.dependencies || issue.dependencies.length === 0) {
    return [];
  }

  return issue.dependencies
    .map((dep) => dep.depends_on_issue)
    .filter((dep): dep is Issue => {
      return dep !== undefined && (dep.status === 'done' || dep.status === 'canceled');
    });
}

/**
 * Check if an issue is in a terminal state
 */
export function isTerminal(issue: Issue): boolean {
  return issue.status === 'done' || issue.status === 'canceled';
}

/**
 * Get status display color
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    todo: 'secondary',
    doing: 'default',
    in_review: 'outline',
    done: 'success',
    canceled: 'destructive',
  };
  return colors[status] || 'secondary';
}

/**
 * Get priority display label
 */
export function getPriorityLabel(priority: number): string {
  return `P${priority}`;
}

/**
 * Validate story points
 *
 * Story points must be in: 1, 2, 3, 5, 8, 13, 21
 */
export function isValidStoryPoints(points: number | null): boolean {
  if (points === null) return true;
  return [1, 2, 3, 5, 8, 13, 21].includes(points);
}

/**
 * Get allowed story point values
 */
export const ALLOWED_STORY_POINTS = [1, 2, 3, 5, 8, 13, 21] as const;

/**
 * Get status transitions allowed from current status
 */
export function getAllowedStatusTransitions(currentStatus: string): string[] {
  const transitions: Record<string, string[]> = {
    todo: ['doing', 'canceled'],
    doing: ['in_review', 'todo', 'canceled'],
    in_review: ['done', 'doing', 'canceled'],
    done: [], // Terminal state
    canceled: ['todo'], // Can reopen
  };
  return transitions[currentStatus] || [];
}
