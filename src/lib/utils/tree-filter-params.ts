// src/lib/utils/tree-filter-params.ts
import {
  VALID_PROJECT_STATUSES,
  VALID_EPIC_STATUSES,
  VALID_ISSUE_STATUSES,
  VALID_PRIORITIES,
  VALID_STORY_POINTS,
} from '$lib/constants/validation';
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

export interface FilterChip {
  label: string;
  param: string;
  value: string;
}

const PROJECT_STATUS_LABELS: Record<string, string> = {
  backlog: 'Backlog',
  planned: 'Planned',
  active: 'Active',
  on_hold: 'On Hold',
  completed: 'Completed',
  canceled: 'Canceled',
};

const EPIC_STATUS_LABELS: Record<string, string> = {
  backlog: 'Backlog',
  active: 'Active',
  on_hold: 'On Hold',
  completed: 'Completed',
  canceled: 'Canceled',
};

const ISSUE_STATUS_LABELS: Record<string, string> = {
  backlog: 'Backlog',
  todo: 'Todo',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
  canceled: 'Canceled',
  ready: 'Ready',
  blocked: 'Blocked',
};

const PRIORITY_LABELS: Record<number, string> = { 0: 'P0', 1: 'P1', 2: 'P2', 3: 'P3' };

export function getFilterChips(f: TreeFilterParams): FilterChip[] {
  const chips: FilterChip[] = [];

  for (const s of f.projectStatus) {
    chips.push({
      label: `Project: ${PROJECT_STATUS_LABELS[s] ?? s}`,
      param: 'project_status',
      value: s,
    });
  }
  for (const s of f.epicStatus) {
    chips.push({ label: `Epic: ${EPIC_STATUS_LABELS[s] ?? s}`, param: 'epic_status', value: s });
  }
  for (const p of f.issuePriority) {
    chips.push({ label: PRIORITY_LABELS[p] ?? `P${p}`, param: 'priority', value: String(p) });
  }
  for (const s of f.issueStatus) {
    chips.push({ label: ISSUE_STATUS_LABELS[s] ?? s, param: 'status', value: s });
  }
  for (const sp of f.issueStoryPoints) {
    chips.push({
      label: sp === null ? 'SP: None' : `SP: ${sp}`,
      param: 'story_points',
      value: sp === null ? 'none' : String(sp),
    });
  }

  return chips;
}

// Helper functions
function parseEnumArray<T extends string>(value: string | null, validValues: readonly T[]): T[] {
  if (!value) return [];
  return value
    .split(',')
    .filter((v) => validValues.includes(v as T))
    .map((v) => v as T);
}

function parseNumberArray(value: string | null, validValues: readonly number[]): number[] {
  if (!value) return [];
  return value
    .split(',')
    .map((v) => parseInt(v, 10))
    .filter((n) => !isNaN(n) && validValues.includes(n));
}

function parseStoryPoints(value: string | null): (number | null)[] {
  if (!value) return [];
  const tokens = value.split(',');
  const hasNone = tokens.includes('none');
  return tokens
    .map((v) => {
      if (v === 'none') return null;
      const num = parseInt(v, 10);
      return !isNaN(num) && (VALID_STORY_POINTS as readonly number[]).includes(num) ? num : null;
    })
    .filter((v) => v !== null || hasNone);
}

function parseEnum<T extends string>(
  value: string | null,
  validValues: readonly T[],
  defaultValue: T,
): T {
  if (!value) return defaultValue;
  return validValues.includes(value as T) ? (value as T) : defaultValue;
}
