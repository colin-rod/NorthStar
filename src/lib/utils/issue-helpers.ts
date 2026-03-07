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

import { VALID_STORY_POINTS } from '$lib/constants/validation';
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
    backlog: 'secondary',
    todo: 'secondary',
    in_progress: 'default',
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
  return VALID_STORY_POINTS.includes(points as (typeof VALID_STORY_POINTS)[number]);
}

/**
 * Get allowed story point values
 */
export const ALLOWED_STORY_POINTS = VALID_STORY_POINTS;

/**
 * Cycle to the next status in linear order.
 * Order: backlog → todo → in_progress → in_review → done → canceled → backlog
 */
export function cycleStatus(current: string): string {
  const order = ['backlog', 'todo', 'in_progress', 'in_review', 'done', 'canceled'];
  const idx = order.indexOf(current);
  return order[(idx + 1) % order.length];
}

/**
 * Get status transitions allowed from current status
 */
export function getAllowedStatusTransitions(currentStatus: string): string[] {
  const transitions: Record<string, string[]> = {
    backlog: ['todo', 'canceled'],
    todo: ['in_progress', 'backlog', 'canceled'],
    in_progress: ['in_review', 'todo', 'canceled'],
    in_review: ['done', 'in_progress', 'canceled'],
    done: [], // Terminal state
    canceled: ['backlog'], // Can reopen
  };
  return transitions[currentStatus] || [];
}

/**
 * Get status group for filtering and rollups
 */
export function getStatusGroup(
  entity: 'project' | 'epic' | 'issue',
  status: string,
): 'backlog' | 'planned' | 'active' | 'paused' | 'completed' | 'canceled' {
  const map: Record<
    string,
    Record<string, 'backlog' | 'planned' | 'active' | 'paused' | 'completed' | 'canceled'>
  > = {
    project: {
      backlog: 'backlog',
      planned: 'planned',
      active: 'active',
      on_hold: 'paused',
      completed: 'completed',
      canceled: 'canceled',
    },
    epic: {
      backlog: 'backlog',
      active: 'active',
      on_hold: 'paused',
      completed: 'completed',
      canceled: 'canceled',
    },
    issue: {
      backlog: 'backlog',
      todo: 'planned',
      in_progress: 'active',
      in_review: 'active',
      done: 'completed',
      canceled: 'canceled',
    },
  };
  return map[entity]?.[status] ?? 'backlog';
}
