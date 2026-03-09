import type { IssueStatus, ProjectStatus, EpicStatus } from '$lib/types';

export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  backlog: 'Backlog',
  todo: 'Todo',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
  canceled: 'Canceled',
};

export const EPIC_STATUS_LABELS: Record<EpicStatus, string> = {
  backlog: 'Backlog',
  active: 'Active',
  on_hold: 'On Hold',
  completed: 'Completed',
  canceled: 'Canceled',
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  backlog: 'Backlog',
  planned: 'Planned',
  active: 'Active',
  on_hold: 'On Hold',
  completed: 'Completed',
  canceled: 'Canceled',
};

export function getStatusLabel(labels: Record<string, string>, status: string): string {
  return labels[status] ?? status;
}
