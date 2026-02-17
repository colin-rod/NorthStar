/**
 * TypeScript Type Definitions
 *
 * All entity types for the NorthStar application.
 *
 * Based on CLAUDE.md database schema.
 */

/**
 * User type (from Supabase Auth)
 */
export interface User {
  id: string;
  email: string;
  created_at: string;
}

/**
 * Project
 *
 * Top-level container for work
 */
export interface Project {
  id: string;
  user_id: string;
  number: number;
  name: string;
  description: string | null;
  created_at: string;
  archived_at: string | null;
  status: ProjectStatus;

  // Relations (populated via joins)
  epics?: Epic[];
}

export type ProjectStatus = 'active' | 'done' | 'canceled';

/**
 * Epic
 *
 * Project-scoped thematic grouping
 */
export interface Epic {
  id: string;
  project_id: string;
  number: number;
  name: string;
  description: string | null;
  status: EpicStatus;
  is_default: boolean;
  sort_order: number | null;
  milestone_id?: string | null;

  // Relations
  project?: Project;
  issues?: Issue[];
  milestone?: Milestone;
}

export type EpicStatus = 'active' | 'done' | 'canceled';

/**
 * Milestone
 *
 * Global (cross-project) reusable label
 */
export interface Milestone {
  id: string;
  user_id: string;
  name: string;
  due_date: string | null; // ISO date string

  // Relations
  issues?: Issue[];
}

/**
 * Issue
 *
 * Primary unit of work
 */
export interface Issue {
  id: string;
  project_id: string;
  epic_id: string;
  number: number;
  parent_issue_id: string | null;
  milestone_id: string | null;
  title: string;
  description: string | null;
  status: IssueStatus;
  priority: number; // 0-3 (P0-P3)
  story_points: StoryPoints | null;
  sort_order: number | null;
  created_at: string;

  // Relations (populated via joins)
  project?: Project;
  epic?: Epic;
  milestone?: Milestone;
  parent_issue?: Issue;
  sub_issues?: Issue[];
  dependencies?: Dependency[]; // Issues this depends on
  blocked_by?: Dependency[]; // Dependencies where this issue is blocked (with depends_on_issue populated)
  blocking?: Dependency[]; // Dependencies where this issue blocks others (with issue populated)
}

export type IssueStatus = 'todo' | 'doing' | 'in_review' | 'done' | 'canceled';

/**
 * Story Points
 *
 * Restricted to Fibonacci sequence values
 */
export type StoryPoints = 1 | 2 | 3 | 5 | 8 | 13 | 21;

/**
 * Dependency
 *
 * Directed relationship: "Issue A depends on Issue B"
 */
export interface Dependency {
  issue_id: string;
  depends_on_issue_id: string;

  // Relations (populated via joins)
  issue?: Issue;
  depends_on_issue?: Issue;
}

/**
 * Computed Issue States
 *
 * These are derived, not stored in database
 */
export interface ComputedIssueState {
  isBlocked: boolean;
  isReady: boolean;
  blockingCount: number; // Number of issues this blocks
  blockedByCount: number; // Number of dependencies
}

/**
 * Form Data Types
 */

export interface CreateIssueInput {
  title: string;
  project_id: string;
  epic_id: string;
  status?: IssueStatus;
  priority?: number;
  story_points?: StoryPoints | null;
  parent_issue_id?: string | null;
  milestone_id?: string | null;
}

export interface UpdateIssueInput extends Partial<CreateIssueInput> {
  id: string;
}

export interface CreateProjectInput {
  name: string;
}

export interface CreateEpicInput {
  name: string;
  project_id: string;
  status?: EpicStatus;
}

export interface CreateDependencyInput {
  issue_id: string;
  depends_on_issue_id: string;
}

/**
 * Page Data Types
 */

export interface HomePageData {
  issues: Issue[];
  readyCount: number;
  blockedCount: number;
  doingCount: number;
  doneCount: number;
}

export interface ProjectPageData {
  project: Project;
  epics: Epic[];
}

export interface EpicPageData {
  epic: Epic;
  issues: Issue[];
}

export interface IssuePageData {
  issue: Issue;
  dependencies: Dependency[];
  subIssues: Issue[];
}

/**
 * Enhanced Issues View Types
 */

export type GroupByMode = 'none' | 'project' | 'status' | 'priority' | 'milestone' | 'story_points';

export type SortByColumn =
  | 'priority'
  | 'status'
  | 'title'
  | 'project'
  | 'epic'
  | 'milestone'
  | 'story_points';

export type SortDirection = 'asc' | 'desc';

export interface IssueGroup {
  key: string; // Unique identifier for group (project_id, status value, priority number, etc.)
  name: string; // Display name (project name, "P0", "Todo", etc.)
  issues: Issue[];
  issueCount: number;
  totalStoryPoints: number;
  completionPercent: number; // % of done issues (excluding canceled)
}

/**
 * Attachment
 *
 * File attachment for a project, epic, or issue.
 * Stored in Supabase Storage; metadata stored in the attachments table.
 */
export interface Attachment {
  id: string;
  user_id: string;
  entity_type: 'project' | 'epic' | 'issue';
  entity_id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  created_at: string;
}
