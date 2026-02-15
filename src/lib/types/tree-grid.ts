/**
 * Tree Grid Types
 *
 * Type definitions for the unified tree grid component that displays
 * Projects → Epics → Issues → Sub-issues in a single consistent table.
 */

import type { Project, Epic, Issue } from './index';

import type { IssueCounts } from '$lib/utils/issue-counts';
import type { ProjectMetrics } from '$lib/utils/project-helpers';

/**
 * TreeNode represents a unified row in the tree grid
 * Can be a Project (level 0), Epic (level 1), Issue (level 2), or Sub-issue (level 3)
 */
export interface TreeNode {
  /** Unique identifier (project.id, epic.id, or issue.id) */
  id: string;

  /** Node type determines which columns are visible/editable */
  type: 'project' | 'epic' | 'issue' | 'sub-issue';

  /** Hierarchy level: 0=Project, 1=Epic, 2=Issue, 3=Sub-issue */
  level: 0 | 1 | 2 | 3;

  /** Parent node ID (null for top-level projects) */
  parentId: string | null;

  /** Whether this node has children (determines if chevron shows) */
  hasChildren: boolean;

  /** The actual entity data (union type) */
  data: Project | Epic | Issue;

  /** Computed issue counts for this node and its descendants */
  counts: IssueCounts;

  /** Computed metrics (total issues, story points) */
  metrics: ProjectMetrics;

  /** Total story points (rollup) - null for sub-issues */
  totalPoints: number | null;

  /** Progress (rollup) - null for sub-issues */
  progress: Progress | null;
}

/**
 * Progress calculation result
 */
export interface Progress {
  /** Number of completed story points */
  completed: number;

  /** Total story points */
  total: number;

  /** Percentage complete (0-100) */
  percentage: number;
}

/**
 * Tree grid state (managed by parent page)
 */
export interface TreeGridState {
  /** Set of expanded node IDs */
  expandedIds: Set<string>;

  /** Set of selected node IDs (for bulk actions) */
  selectedIds: Set<string>;

  /** Whether edit mode is enabled */
  editMode: boolean;

  /** Whether drag-and-drop is disabled */
  dragDisabled: boolean;
}

/**
 * Column definition for tree grid
 */
export interface ColumnDef {
  /** Column identifier */
  key: string;

  /** Header text */
  header: string;

  /** Column width (Tailwind class or px value) */
  width: string;

  /** Whether this column is visible for a given node */
  visible: (node: TreeNode) => boolean;

  /** Whether this column is editable for a given node */
  editable: (node: TreeNode) => boolean;
}

/**
 * Editable field types
 */
export type EditableField = 'title' | 'status' | 'milestone_id' | 'story_points' | 'priority';

/**
 * Type guards
 */
export function isProject(node: TreeNode): node is TreeNode & { data: Project } {
  return node.type === 'project';
}

export function isEpic(node: TreeNode): node is TreeNode & { data: Epic } {
  return node.type === 'epic';
}

export function isIssue(node: TreeNode): node is TreeNode & { data: Issue } {
  return node.type === 'issue';
}

export function isSubIssue(node: TreeNode): node is TreeNode & { data: Issue } {
  return node.type === 'sub-issue';
}

/**
 * Get level from node type
 */
export function getLevelFromType(type: TreeNode['type']): 0 | 1 | 2 | 3 {
  switch (type) {
    case 'project':
      return 0;
    case 'epic':
      return 1;
    case 'issue':
      return 2;
    case 'sub-issue':
      return 3;
  }
}
