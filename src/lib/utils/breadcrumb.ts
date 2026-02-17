/**
 * Breadcrumb Utility
 *
 * Builds breadcrumb strings for tree grid navigation
 */

import type { Project, Epic, Issue } from '$lib/types';
import type { TreeNode } from '$lib/types/tree-grid';
import { isProject, isEpic, isIssue, isSubIssue } from '$lib/types/tree-grid';

/**
 * Builds a breadcrumb string from the expanded node
 * Format: "P-1 Personal Tasks / E-3 Backend / I-2 Issue Title"
 *
 * @param expandedId - ID of the currently expanded node (null if none)
 * @param allNodes - All tree nodes
 * @returns Breadcrumb string, or empty string if no node is expanded
 */
export function buildBreadcrumb(expandedId: string | null, allNodes: TreeNode[]): string {
  if (!expandedId) {
    return '';
  }

  // Find the expanded node
  const expandedNode = allNodes.find((n) => n.id === expandedId);
  if (!expandedNode) {
    return '';
  }

  // Build path from root to expanded node
  const path: TreeNode[] = [];
  let currentNode: TreeNode | undefined = expandedNode;

  // Walk up to root
  while (currentNode) {
    path.unshift(currentNode); // Add to beginning
    const parentId: string | null = currentNode.parentId;
    currentNode = parentId ? allNodes.find((n) => n.id === parentId) : undefined;
  }

  // Format each node
  return path.map(formatNodeForBreadcrumb).join(' / ');
}

/**
 * Formats a single node for breadcrumb display
 * Format: "{identifier} {name/title}"
 *
 * @param node - The tree node to format
 * @returns Formatted string (e.g., "P-1 Personal Tasks")
 */
function formatNodeForBreadcrumb(node: TreeNode): string {
  let prefix = '';
  let name = '';

  if (isProject(node)) {
    const project = node.data as Project;
    prefix = `P-${project.number}`;
    name = project.name;
  } else if (isEpic(node)) {
    const epic = node.data as Epic;
    prefix = `E-${epic.number}`;
    name = epic.name;
  } else if (isIssue(node) || isSubIssue(node)) {
    const issue = node.data as Issue;
    prefix = `I-${issue.number}`;
    name = issue.title;
  }

  return `${prefix} ${name}`;
}
