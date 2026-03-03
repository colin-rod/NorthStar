// src/lib/utils/tree-filter-params.ts
import type {
  ProjectStatus,
  EpicStatus,
  IssueStatus,
  SortByColumn,
  SortDirection,
} from '$lib/types';

export interface TreeFilterParams {
  projectStatus: ProjectStatus[];
  epicStatus: EpicStatus[];
  issuePriority: number[];
  issueStatus: IssueStatus[];
  issueStoryPoints: (number | null)[];
  groupBy: string;
  sortBy: SortByColumn;
  sortDir: SortDirection;
}

const VALID_PROJECT_STATUSES: ProjectStatus[] = [
  'backlog',
  'planned',
  'active',
  'on_hold',
  'completed',
  'canceled',
];
const VALID_EPIC_STATUSES: EpicStatus[] = ['backlog', 'active', 'on_hold', 'completed', 'canceled'];
const VALID_ISSUE_STATUSES: IssueStatus[] = [
  'backlog',
  'todo',
  'in_progress',
  'in_review',
  'done',
  'canceled',
];
const VALID_PRIORITIES = [0, 1, 2, 3];
const VALID_STORY_POINTS = [1, 2, 3, 5, 8, 13, 21];
const VALID_GROUP_BY = ['none', 'priority', 'status', 'milestone', 'story_points'];
const VALID_SORT_BY: SortByColumn[] = [
  'priority',
  'status',
  'title',
  'project',
  'epic',
  'milestone',
  'story_points',
  'progress',
];

export function parseTreeFilterParams(params: URLSearchParams): TreeFilterParams {
  return {
    projectStatus: parseEnumArray(params.get('project_status'), VALID_PROJECT_STATUSES),
    epicStatus: parseEnumArray(params.get('epic_status'), VALID_EPIC_STATUSES),
    issuePriority: parseNumberArray(params.get('priority'), VALID_PRIORITIES),
    issueStatus: parseEnumArray(params.get('status'), VALID_ISSUE_STATUSES),
    issueStoryPoints: parseStoryPoints(params.get('story_points')),
    groupBy: parseEnum(params.get('group_by'), VALID_GROUP_BY, 'none'),
    sortBy: parseEnum(params.get('sort_by'), VALID_SORT_BY, 'priority'),
    sortDir: params.get('sort_dir') === 'desc' ? 'desc' : 'asc',
  };
}

export function buildTreeFilterUrl(filters: TreeFilterParams, basePath: string): string {
  const parts: string[] = [];

  if (filters.projectStatus.length > 0) {
    parts.push(`project_status=${filters.projectStatus.join(',')}`);
  }
  if (filters.epicStatus.length > 0) {
    parts.push(`epic_status=${filters.epicStatus.join(',')}`);
  }
  if (filters.issuePriority.length > 0) {
    parts.push(`priority=${filters.issuePriority.join(',')}`);
  }
  if (filters.issueStatus.length > 0) {
    parts.push(`status=${filters.issueStatus.join(',')}`);
  }
  if (filters.issueStoryPoints.length > 0) {
    const storyPointsStr = filters.issueStoryPoints
      .map((sp) => (sp === null ? 'none' : sp))
      .join(',');
    parts.push(`story_points=${storyPointsStr}`);
  }
  if (filters.groupBy !== 'none') {
    parts.push(`group_by=${filters.groupBy}`);
  }
  if (filters.sortBy !== 'priority') {
    parts.push(`sort_by=${filters.sortBy}`);
  }
  if (filters.sortDir !== 'asc') {
    parts.push(`sort_dir=${filters.sortDir}`);
  }

  return parts.length > 0 ? `${basePath}?${parts.join('&')}` : basePath;
}

// Helper functions
function parseEnumArray<T extends string>(value: string | null, validValues: readonly T[]): T[] {
  if (!value) return [];
  return value
    .split(',')
    .filter((v) => validValues.includes(v as T))
    .map((v) => v as T);
}

function parseNumberArray(value: string | null, validValues: number[]): number[] {
  if (!value) return [];
  return value
    .split(',')
    .map((v) => parseInt(v, 10))
    .filter((n) => !isNaN(n) && validValues.includes(n));
}

function parseStoryPoints(value: string | null): (number | null)[] {
  if (!value) return [];
  return value
    .split(',')
    .map((v) => {
      if (v === 'none') return null;
      const num = parseInt(v, 10);
      return !isNaN(num) && VALID_STORY_POINTS.includes(num) ? num : null;
    })
    .filter((v) => v !== null || value.includes('none'));
}

function parseEnum<T extends string>(
  value: string | null,
  validValues: readonly T[],
  defaultValue: T,
): T {
  if (!value) return defaultValue;
  return validValues.includes(value as T) ? (value as T) : defaultValue;
}
