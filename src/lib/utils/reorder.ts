/**
 * Reorder Utilities
 *
 * Functions for calculating sort_order values when reordering lists.
 *
 * Used by: Epic detail page for issue reordering
 */

import type { Issue } from '$lib/types';

/**
 * Calculate new sort_order values for a reordered list
 *
 * After a drag-and-drop operation, this recalculates sort_order
 * values sequentially (0, 1, 2, ...) for all items.
 *
 * Returns only issues that changed, for efficient batch update.
 *
 * @param issues - Reordered array of issues
 * @returns Map of issue ID to new sort_order value (only changed items)
 */
export function calculateNewSortOrders(issues: Issue[]): Map<string, number> {
  const updates = new Map<string, number>();

  issues.forEach((issue, index) => {
    const newSortOrder = index;
    // Only include if sort_order actually changed
    if (issue.sort_order !== newSortOrder) {
      updates.set(issue.id, newSortOrder);
    }
  });

  return updates;
}

/**
 * Move issue up one position in sort order
 *
 * Swaps sort_order values with the previous issue.
 *
 * @param issues - Current array of issues (must be sorted by sort_order)
 * @param issueId - ID of issue to move up
 * @returns Map of issue ID to new sort_order value (only changed items)
 */
export function moveIssueUp(issues: Issue[], issueId: string): Map<string, number> {
  const updates = new Map<string, number>();
  const currentIndex = issues.findIndex((i) => i.id === issueId);

  // Can't move up if already first
  if (currentIndex <= 0) {
    return updates;
  }

  const currentIssue = issues[currentIndex];
  const previousIssue = issues[currentIndex - 1];

  // Swap sort_order values
  const currentSortOrder = currentIssue.sort_order ?? currentIndex;
  const previousSortOrder = previousIssue.sort_order ?? currentIndex - 1;

  updates.set(currentIssue.id, previousSortOrder);
  updates.set(previousIssue.id, currentSortOrder);

  return updates;
}

/**
 * Move issue down one position in sort order
 *
 * Swaps sort_order values with the next issue.
 *
 * @param issues - Current array of issues (must be sorted by sort_order)
 * @param issueId - ID of issue to move down
 * @returns Map of issue ID to new sort_order value (only changed items)
 */
export function moveIssueDown(issues: Issue[], issueId: string): Map<string, number> {
  const updates = new Map<string, number>();
  const currentIndex = issues.findIndex((i) => i.id === issueId);

  // Can't move down if already last
  if (currentIndex < 0 || currentIndex >= issues.length - 1) {
    return updates;
  }

  const currentIssue = issues[currentIndex];
  const nextIssue = issues[currentIndex + 1];

  // Swap sort_order values
  const currentSortOrder = currentIssue.sort_order ?? currentIndex;
  const nextSortOrder = nextIssue.sort_order ?? currentIndex + 1;

  updates.set(currentIssue.id, nextSortOrder);
  updates.set(nextIssue.id, currentSortOrder);

  return updates;
}

/**
 * Get next available sort_order value
 *
 * Finds the maximum sort_order in the array and returns max + 1.
 * Returns 0 if the array is empty.
 *
 * @param issues - Array of issues
 * @returns Next sort_order value to use for new issue
 */
export function getNextSortOrder(issues: Issue[]): number {
  if (issues.length === 0) {
    return 0;
  }

  const maxOrder = Math.max(...issues.map((i) => i.sort_order ?? 0));
  return maxOrder + 1;
}
