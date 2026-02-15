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
    // All issues for this project (flatten sub-issues into same array)
    const projectIssues = project.issues || [];

    // Level 0: Project
    nodes.push(createProjectNode(project, projectIssues));

    // Level 1: Epics
    for (const epic of project.epics || []) {
      const epicIssues = projectIssues.filter((i) => i.epic_id === epic.id && !i.parent_issue_id);

      nodes.push(createEpicNode(epic, project.id, epicIssues, projectIssues));

      // Level 2: Top-level Issues (no parent_issue_id)
      for (const issue of epicIssues) {
        const subIssues = projectIssues.filter((i) => i.parent_issue_id === issue.id);

        nodes.push(createIssueNode(issue, epic.id, project.id, subIssues));

        // Level 3: Sub-issues
        for (const subIssue of subIssues) {
          nodes.push(createSubIssueNode(subIssue, issue.id, epic.id, project.id));
        }
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
 * Per spec: Project=0px, Epic=16px, Issue=32px, Sub-issue=48px
 *
 * @param level - Hierarchy level (0-3)
 * @returns Indentation in pixels
 */
export function calculateIndentation(level: 0 | 1 | 2 | 3): string {
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
  const hasChildren = epicIssues.length > 0;

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
function createIssueNode(
  issue: Issue,
  epicId: string,
  projectId: string,
  subIssues: Issue[],
): TreeNode {
  const hasChildren = subIssues.length > 0;
  const allIssues = [issue, ...subIssues];

  return {
    id: issue.id,
    type: 'issue',
    level: 2,
    parentId: epicId,
    hasChildren,
    data: issue,
    counts: computeIssueCounts(allIssues),
    metrics: computeProjectMetrics(allIssues),
    totalPoints: null, // Computed dynamically
    progress: null, // Computed dynamically
  };
}

/**
 * Create a TreeNode for a sub-issue (level 3)
 */
function createSubIssueNode(
  subIssue: Issue,
  parentIssueId: string,
  _epicId: string,
  _projectId: string,
): TreeNode {
  return {
    id: subIssue.id,
    type: 'sub-issue',
    level: 3,
    parentId: parentIssueId,
    hasChildren: false, // Sub-issues cannot have children
    data: subIssue,
    counts: computeIssueCounts([subIssue]),
    metrics: computeProjectMetrics([subIssue]),
    totalPoints: null, // Sub-issues don't have rollup
    progress: null, // Sub-issues don't have progress
  };
}

/**
 * Get all descendant nodes of a given node
 *
 * @param node - Parent node
 * @param allNodes - All tree nodes
 * @returns Array of descendant nodes
 */
export function getDescendantNodes(node: TreeNode, allNodes: TreeNode[]): TreeNode[] {
  const descendants: TreeNode[] = [];

  function collectDescendants(parentId: string) {
    const children = allNodes.filter((n) => n.parentId === parentId);
    for (const child of children) {
      descendants.push(child);
      collectDescendants(child.id);
    }
  }

  collectDescendants(node.id);
  return descendants;
}

/**
 * Get all descendant issue nodes (level 2 or 3) for calculating progress
 *
 * @param node - Parent node
 * @param allNodes - All tree nodes
 * @returns Array of issue/sub-issue nodes
 */
export function getDescendantIssues(node: TreeNode, allNodes: TreeNode[]): TreeNode[] {
  const descendants = getDescendantNodes(node, allNodes);
  return descendants.filter((n) => n.type === 'issue' || n.type === 'sub-issue');
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
