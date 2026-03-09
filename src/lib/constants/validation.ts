export const VALID_ISSUE_STATUSES = [
  'backlog',
  'todo',
  'in_progress',
  'in_review',
  'done',
  'canceled',
] as const;

export const VALID_EPIC_STATUSES = [
  'backlog',
  'active',
  'on_hold',
  'completed',
  'canceled',
] as const;

export const VALID_PROJECT_STATUSES = [
  'backlog',
  'planned',
  'active',
  'on_hold',
  'completed',
  'canceled',
] as const;

export const VALID_STORY_POINTS = [1, 2, 3, 5, 8, 13, 21] as const;

export const VALID_PRIORITIES = [0, 1, 2, 3] as const;

export const VALID_ENTITY_TYPES = ['project', 'epic', 'issue'] as const;

export const MAX_NAME_LENGTH = 100;

export const MAX_ISSUE_TITLE_LENGTH = 500;

export const DEFAULT_ISSUE_PRIORITY = 2;
