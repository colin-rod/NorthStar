/**
 * Drag-Drop Validation Utilities
 *
 * Handles reparenting validation for tree grid drag-and-drop operations.
 * Enforces hierarchy rules and prevents invalid moves (cycles, wrong parents).
 */

import type { TreeNode } from '$lib/types/tree-grid';

/**
 * Determine if dragging sourceNode onto targetNode is a valid reparent operation
 *
 * Validation Rules:
 * - Cannot drag project (top-level only, no parent)
 * - Cannot drop on self
 * - Cannot drop on own descendant (would create cycle)
 * - Must respect hierarchy: Epic→Project, Issue→Epic, Sub-issue→Issue
 */
export function canReparent(
  sourceNode: TreeNode,
  targetNode: TreeNode,
  allNodes: TreeNode[],
): boolean {
  // Rule 1: Cannot drag project (top-level only)
  if (sourceNode.type === 'project') return false;

  // Rule 2: Cannot drop on self
  if (sourceNode.id === targetNode.id) return false;

  // Rule 3: Cannot drop on own descendant (would create cycle)
  if (isDescendant(targetNode, sourceNode, allNodes)) return false;

  // Rule 4: Hierarchy constraints
  if (sourceNode.type === 'epic' && targetNode.type === 'project') return true;
  if (sourceNode.type === 'issue' && targetNode.type === 'epic') return true;
  if (sourceNode.type === 'sub-issue' && targetNode.type === 'issue') return true;

  return false;
}

/**
 * Check if targetNode is a descendant of sourceNode (cycle detection)
 */
function isDescendant(targetNode: TreeNode, sourceNode: TreeNode, allNodes: TreeNode[]): boolean {
  let current: TreeNode | undefined = targetNode;

  while (current && current.parentId) {
    if (current.parentId === sourceNode.id) return true;
    const parentId: string = current.parentId;
    current = allNodes.find((n) => n.id === parentId);
  }

  return false;
}

/**
 * Get all valid drop target IDs for a dragging node
 *
 * Includes:
 * - Valid reparent targets (different parent type)
 * - Siblings (for reordering within same parent)
 */
export function getValidDropTargets(draggingNode: TreeNode, allNodes: TreeNode[]): Set<string> {
  const validIds = new Set<string>();

  for (const node of allNodes) {
    // Check if valid reparent target
    if (canReparent(draggingNode, node, allNodes)) {
      validIds.add(node.id);
    }

    // Also allow reordering within same parent (siblings)
    if (node.parentId === draggingNode.parentId && node.id !== draggingNode.id) {
      validIds.add(node.id);
    }
  }

  return validIds;
}

/**
 * Determine if drop is a reparent (new parent) or reorder (same parent)
 */
export function isReparentDrop(sourceNode: TreeNode, targetNode: TreeNode): boolean {
  // If target is same level and parent, it's a reorder
  if (sourceNode.parentId === targetNode.parentId) return false;

  // If target is valid parent type, it's a reparent
  return canReparent(sourceNode, targetNode, []);
}
