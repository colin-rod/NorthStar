/**
 * Tree Grid Helpers
 *
 * Utilities for flattening hierarchical project data into a flat list of TreeNodes
 * and managing tree grid visibility based on expansion state.
 */

import type { Project, Epic, Issue } from '$lib/types';
import type { TreeNode } from '$lib/types/tree-grid';
import type { IssueCounts } from '$lib/utils/issue-counts';
import { computeIssueCounts } from '$lib/utils/issue-counts';
import type { ProjectMetrics } from '$lib/utils/project-helpers';
import { computeProjectMetrics } from '$lib/utils/project-helpers';

/**
 * Flatten hierarchical project data into a flat list of TreeNodes
 *
 * @param projects - Array of projects with nested epics and issues
 * @returns Flat array of TreeNodes representing all hierarchy levels
 */
export function flattenTree(
  projects: (Project & {
    epics?: Epic[];
    issues?: Issue[];
    counts?: IssueCounts;
    metrics?: ProjectMetrics;
  })[],
): TreeNode[] {
  const nodes: TreeNode[] = [];

  for (const project of projects) {
    const projectIssues = project.issues || [];

    // Level 0: Project
    nodes.push(createProjectNode(project, projectIssues));

    // Level 1: Epics
    for (const epic of project.epics || []) {
      const epicIssues = projectIssues.filter((i) => i.epic_id === epic.id);

      nodes.push(createEpicNode(epic, project.id, epicIssues, projectIssues));

      // Level 2: Issues
      for (const issue of epicIssues) {
        nodes.push(createIssueNode(issue, epic.id, project.id));
      }
    }
  }

  return nodes;
}

/**
 * Filter nodes to show only those that should be visible based on expansion state
 *
 * @param allNodes - All flattened tree nodes
 * @param expandedIds - Set of expanded node IDs
 * @returns Filtered array of visible nodes
 */
export function getVisibleNodes(allNodes: TreeNode[], expandedIds: Set<string>): TreeNode[] {
  return allNodes.filter((node) => {
    // Always show projects (level 0)
    if (node.level === 0) return true;

    // For other levels, show only if parent is expanded
    return node.parentId && expandedIds.has(node.parentId);
  });
}

/**
 * Calculate indentation for a given hierarchy level
 *
 * Per spec: Project=0px, Epic=16px, Issue=32px
 *
 * @param level - Hierarchy level (0-2)
 * @returns Indentation in pixels
 */
export function calculateIndentation(level: 0 | 1 | 2): string {
  return `${level * 16}px`;
}

/**
 * Create a TreeNode for a project (level 0)
 */
function createProjectNode(
  project: Project & { epics?: Epic[]; counts?: IssueCounts; metrics?: ProjectMetrics },
  projectIssues: Issue[],
): TreeNode {
  const hasChildren = (project.epics?.length || 0) > 0;

  return {
    id: project.id,
    type: 'project',
    level: 0,
    parentId: null,
    hasChildren,
    data: project,
    counts: project.counts || computeIssueCounts(projectIssues),
    metrics: project.metrics || computeProjectMetrics(projectIssues),
    totalPoints: null, // Computed dynamically
    progress: null, // Computed dynamically
  };
}

/**
 * Create a TreeNode for an epic (level 1)
 */
function createEpicNode(
  epic: Epic,
  projectId: string,
  epicIssues: Issue[],
  allProjectIssues: Issue[],
): TreeNode {
  // Always true for epics to enable inline issue creation even when empty
  const hasChildren = true;

  return {
    id: epic.id,
    type: 'epic',
    level: 1,
    parentId: projectId,
    hasChildren,
    data: epic,
    counts: computeIssueCounts(epicIssues),
    metrics: computeProjectMetrics(allProjectIssues.filter((i) => i.epic_id === epic.id)),
    totalPoints: null, // Computed dynamically
    progress: null, // Computed dynamically
  };
}

/**
 * Create a TreeNode for an issue (level 2)
 */
function createIssueNode(issue: Issue, epicId: string, _projectId: string): TreeNode {
  return {
    id: issue.id,
    type: 'issue',
    level: 2,
    parentId: epicId,
    hasChildren: false,
    data: issue,
    counts: computeIssueCounts([issue]),
    metrics: computeProjectMetrics([issue]),
    totalPoints: null, // Computed dynamically
    progress: null, // Computed dynamically
  };
}

/**
 * Build an index mapping parentId → children for O(1) child lookup.
 *
 * @param allNodes - All tree nodes
 * @returns Map from parentId to array of child nodes
 */
export function buildChildrenIndex(allNodes: TreeNode[]): Map<string | null, TreeNode[]> {
  const index = new Map<string | null, TreeNode[]>();
  for (const node of allNodes) {
    const key = node.parentId;
    if (!index.has(key)) index.set(key, []);
    index.get(key)!.push(node);
  }
  return index;
}

/**
 * Get all descendant nodes of a given node
 *
 * @param node - Parent node
 * @param allNodes - All tree nodes (used to build index if not provided)
 * @param childrenIndex - Optional pre-built children index for O(1) lookups
 * @returns Array of descendant nodes
 */
export function getDescendantNodes(
  node: TreeNode,
  allNodes: TreeNode[],
  childrenIndex?: Map<string | null, TreeNode[]>,
): TreeNode[] {
  const index = childrenIndex ?? buildChildrenIndex(allNodes);
  const descendants: TreeNode[] = [];

  function collectDescendants(parentId: string) {
    const children = index.get(parentId) ?? [];
    for (const child of children) {
      descendants.push(child);
      collectDescendants(child.id);
    }
  }

  collectDescendants(node.id);
  return descendants;
}

/**
 * Get all descendant issue nodes (level 2) for calculating progress
 *
 * @param node - Parent node
 * @param allNodes - All tree nodes (used to build index if not provided)
 * @param childrenIndex - Optional pre-built children index for O(1) lookups
 * @returns Array of issue nodes
 */
export function getDescendantIssues(
  node: TreeNode,
  allNodes: TreeNode[],
  childrenIndex?: Map<string | null, TreeNode[]>,
): TreeNode[] {
  const descendants = getDescendantNodes(node, allNodes, childrenIndex);
  return descendants.filter((n) => n.type === 'issue');
}

/**
 * Determine if a node is the last child among its siblings
 *
 * @param node - Node to check
 * @param visibleNodes - Array of visible nodes (already filtered by expansion)
 * @returns True if node is the last child of its parent, false otherwise
 */
export function isLastChild(node: TreeNode, visibleNodes: TreeNode[]): boolean {
  if (!node.parentId) return false; // Top-level nodes have no siblings in this context

  const siblings = visibleNodes.filter((n) => n.parentId === node.parentId);
  const nodeIndex = siblings.findIndex((n) => n.id === node.id);

  return nodeIndex === siblings.length - 1;
}
