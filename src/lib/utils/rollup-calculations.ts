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

import { getDescendantIssues } from './tree-grid-helpers';

import type { Issue } from '$lib/types';
import type { TreeNode, Progress } from '$lib/types/tree-grid';

/**
 * Calculate total story points for a node (rollup)
 *
 * @param node - Tree node to calculate for
 * @param allNodes - All tree nodes (needed to find children)
 * @returns Total story points or null if not applicable
 */
export function calculateTotalPoints(node: TreeNode, allNodes: TreeNode[]): number | null {
  // Issue: own SP
  if (node.type === 'issue') {
    return (node.data as Issue).story_points || 0;
  }

  // Epic: sum of all child issue totals
  if (node.type === 'epic') {
    const issues = allNodes.filter((n) => n.type === 'issue' && n.parentId === node.id);
    return issues.reduce((sum, issue) => sum + (calculateTotalPoints(issue, allNodes) || 0), 0);
  }

  // Project: sum of all child epic totals
  if (node.type === 'project') {
    const epics = allNodes.filter((n) => n.type === 'epic' && n.parentId === node.id);
    return epics.reduce((sum, epic) => sum + (calculateTotalPoints(epic, allNodes) || 0), 0);
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
export function calculateProgress(node: TreeNode, allNodes: TreeNode[]): Progress | null {
  // Get all descendant issues (recursive)
  const descendantIssues = getDescendantIssues(node, allNodes);

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
export function updateNodeRollups(node: TreeNode, allNodes: TreeNode[]): void {
  node.totalPoints = calculateTotalPoints(node, allNodes);
  node.progress = calculateProgress(node, allNodes);
}

/**
 * Update all nodes with calculated rollups
 *
 * Mutates all nodes to set totalPoints and progress
 *
 * @param nodes - All tree nodes
 */
export function updateAllNodeRollups(nodes: TreeNode[]): void {
  for (const node of nodes) {
    updateNodeRollups(node, nodes);
  }
}
