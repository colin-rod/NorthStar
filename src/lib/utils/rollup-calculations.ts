/**
 * Rollup Calculations
 *
 * Calculate Total Story Points and Progress rollups for tree grid nodes.
 *
 * Rollup Rules:
 * - Issue: own SP
 * - Epic: sum(issue total SP)
 * - Project: sum(epic total SP)
 *
 * Progress Rules:
 * - Progress = (Done SP / Non-Canceled SP) * 100
 * - Canceled issues are excluded from both numerator and denominator
 * - If Non-Canceled SP = 0, progress = 100% if all non-canceled done, else 0%
 */

import { buildChildrenIndex, getDescendantIssues } from './tree-grid-helpers';

import type { Issue } from '$lib/types';
import type { TreeNode, Progress } from '$lib/types/tree-grid';

/**
 * Calculate total story points for a node (rollup)
 *
 * @param node - Tree node to calculate for
 * @param allNodes - All tree nodes (needed to find children)
 * @returns Total story points or null if not applicable
 */
export function calculateTotalPoints(
  node: TreeNode,
  allNodes: TreeNode[],
  childrenIndex?: Map<string | null, TreeNode[]>,
): number | null {
  // Issue: own SP
  if (node.type === 'issue') {
    return (node.data as Issue).story_points || 0;
  }

  const index = childrenIndex ?? buildChildrenIndex(allNodes);
  const children = index.get(node.id) ?? [];

  // Epic: sum of all child issue totals
  if (node.type === 'epic') {
    return children.reduce(
      (sum, issue) => sum + (calculateTotalPoints(issue, allNodes, index) || 0),
      0,
    );
  }

  // Project: sum of all child epic totals
  if (node.type === 'project') {
    return children.reduce(
      (sum, epic) => sum + (calculateTotalPoints(epic, allNodes, index) || 0),
      0,
    );
  }

  return null;
}

/**
 * Calculate progress for a node (rollup)
 *
 * Progress is calculated as:
 * - (Completed SP / Total SP) * 100
 * - Completed SP = sum of all Done issue SP (canceled excluded)
 * - Total SP = sum of all non-canceled issue SP
 *
 * @param node - Tree node to calculate for
 * @param allNodes - All tree nodes (needed to find descendants)
 * @returns Progress object or null if not applicable
 */
export function calculateProgress(
  node: TreeNode,
  allNodes: TreeNode[],
  childrenIndex?: Map<string | null, TreeNode[]>,
): Progress | null {
  // Issue: progress is based on its own status
  if (node.type === 'issue') {
    const issue = node.data as Issue;
    if (issue.status === 'canceled') return null;
    const done = issue.status === 'done';
    return { completed: done ? 1 : 0, total: 1, percentage: done ? 100 : 0 };
  }

  const index = childrenIndex ?? buildChildrenIndex(allNodes);

  // Get all descendant issues (recursive)
  const descendantIssues = getDescendantIssues(node, allNodes, index);

  // No descendants = 0% progress
  if (descendantIssues.length === 0) {
    return { completed: 0, total: 0, percentage: 0 };
  }

  // Exclude canceled issues from totals (not in denominator OR numerator)
  const nonCanceledIssues = descendantIssues.filter(
    (issue) => (issue.data as Issue).status !== 'canceled',
  );

  // Calculate total and completed story points (canceled excluded)
  const totalPoints = nonCanceledIssues.reduce(
    (sum, issue) => sum + ((issue.data as Issue).story_points || 0),
    0,
  );

  const completedPoints = nonCanceledIssues
    .filter((issue) => (issue.data as Issue).status === 'done')
    .reduce((sum, issue) => sum + ((issue.data as Issue).story_points || 0), 0);

  // Calculate percentage
  let percentage = 0;
  if (totalPoints > 0) {
    percentage = Math.round((completedPoints / totalPoints) * 100);
  } else {
    // Fallback: If all non-canceled issues are done, show 100%, else 0%
    const allDone =
      nonCanceledIssues.length > 0 &&
      nonCanceledIssues.every((issue) => (issue.data as Issue).status === 'done');
    percentage = allDone ? 100 : 0;
  }

  return {
    completed: completedPoints,
    total: totalPoints,
    percentage,
  };
}

/**
 * Update node with calculated rollups
 *
 * Mutates the node to set totalPoints and progress
 *
 * @param node - Tree node to update
 * @param allNodes - All tree nodes
 */
export function updateNodeRollups(
  node: TreeNode,
  allNodes: TreeNode[],
  childrenIndex?: Map<string | null, TreeNode[]>,
): void {
  node.totalPoints = calculateTotalPoints(node, allNodes, childrenIndex);
  node.progress = calculateProgress(node, allNodes, childrenIndex);
}

/**
 * Update all nodes with calculated rollups
 *
 * Builds a children index once (O(N)) then updates each node in a single pass,
 * reducing overall complexity from O(N³) to O(N).
 *
 * @param nodes - All tree nodes
 */
export function updateAllNodeRollups(nodes: TreeNode[]): void {
  const childrenIndex = buildChildrenIndex(nodes);
  for (const node of nodes) {
    updateNodeRollups(node, nodes, childrenIndex);
  }
}
