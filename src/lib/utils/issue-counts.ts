/**
 * Issue Count Utilities
 *
 * Functions for computing issue counts by state.
 *
 * Requirements from CLAUDE.md:
 * - Blocked is EXCLUSIVE - blocked issues don't count in status bucket
 * - Ready = status 'todo' AND not blocked
 */

import { isBlocked } from './issue-helpers';

import type { Issue } from '$lib/types';

export interface IssueCounts {
  ready: number;
  backlog: number;
  blocked: number;
  in_progress: number;
  inReview: number;
  done: number;
  canceled: number;
}

/**
 * Compute issue counts by state
 *
 * CRITICAL: Blocked is EXCLUSIVE. If an issue is blocked, it counts
 * ONLY in the "blocked" bucket, not in its status bucket.
 *
 * @param issues - Array of issues with dependencies loaded
 * @returns Counts object with 7 states
 */
export interface Progress {
  completed: number;
  total: number;
  percentage: number;
}

export function computeProgress(counts: IssueCounts): Progress {
  // Canceled is excluded from both numerator and denominator
  const completed = counts.done;
  const total =
    counts.ready +
    counts.backlog +
    counts.blocked +
    counts.in_progress +
    counts.inReview +
    counts.done;
  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

export function computeIssueCounts(issues: Issue[]): IssueCounts {
  const counts: IssueCounts = {
    ready: 0,
    backlog: 0,
    blocked: 0,
    in_progress: 0,
    inReview: 0,
    done: 0,
    canceled: 0,
  };

  for (const issue of issues) {
    // Blocked is EXCLUSIVE - if blocked, don't count in status bucket
    if (isBlocked(issue)) {
      counts.blocked++;
      continue; // Skip status counting
    }

    // Count by status (only reached if NOT blocked)
    switch (issue.status) {
      case 'backlog':
        counts.backlog++;
        break;
      case 'todo':
        counts.ready++; // Ready = todo + not blocked
        break;
      case 'in_progress':
        counts.in_progress++;
        break;
      case 'in_review':
        counts.inReview++;
        break;
      case 'done':
        counts.done++;
        break;
      case 'canceled':
        counts.canceled++;
        break;
    }
  }

  return counts;
}
