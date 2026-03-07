import {
  VALID_ISSUE_STATUSES,
  VALID_EPIC_STATUSES,
  VALID_PROJECT_STATUSES,
  VALID_STORY_POINTS,
  DEFAULT_ISSUE_PRIORITY,
  MAX_NAME_LENGTH,
  MAX_ISSUE_TITLE_LENGTH,
} from '$lib/constants/validation';

export type ImportEntityType = 'projects' | 'epics' | 'issues';

export interface ParsedProject {
  name: string;
  status: string;
}

export interface ParsedEpic {
  name: string;
  project_name: string;
  status: string;
}

export interface ParsedIssue {
  title: string;
  project_name: string;
  epic_name: string;
  status: string;
  priority: number;
  story_points: number | null;
}

export interface ParseError {
  row: number;
  message: string;
}

export interface ParseResult<T> {
  rows: T[];
  errors: ParseError[];
}

/** Parse CSV text into an array of row objects keyed by header name. */
function parseCsvRows(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase().trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitCsvLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx] ?? '').trim();
    });
    rows.push(row);
  }

  return { headers, rows };
}

/** Split a single CSV line respecting double-quoted fields. */
function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

export function parseProjectsCsv(text: string): ParseResult<ParsedProject> {
  const { headers, rows } = parseCsvRows(text);
  const errors: ParseError[] = [];
  const result: ParsedProject[] = [];

  if (!headers.includes('name')) {
    errors.push({ row: 0, message: 'Missing required column: name' });
    return { rows: result, errors };
  }

  rows.forEach((row, idx) => {
    const rowNum = idx + 2; // 1-based, +1 for header
    const name = row['name'] ?? '';
    const status = row['status'] || 'backlog';

    if (!name) {
      errors.push({ row: rowNum, message: 'name is required' });
      return;
    }
    if (name.length > MAX_NAME_LENGTH) {
      errors.push({ row: rowNum, message: `name must be ${MAX_NAME_LENGTH} characters or less` });
      return;
    }
    if (!VALID_PROJECT_STATUSES.includes(status as (typeof VALID_PROJECT_STATUSES)[number])) {
      errors.push({
        row: rowNum,
        message: `invalid status "${status}". Must be one of: ${VALID_PROJECT_STATUSES.join(', ')}`,
      });
      return;
    }

    result.push({ name, status });
  });

  return { rows: result, errors };
}

export function parseEpicsCsv(text: string): ParseResult<ParsedEpic> {
  const { headers, rows } = parseCsvRows(text);
  const errors: ParseError[] = [];
  const result: ParsedEpic[] = [];

  const missingCols = ['name', 'project_name'].filter((c) => !headers.includes(c));
  if (missingCols.length > 0) {
    errors.push({ row: 0, message: `Missing required columns: ${missingCols.join(', ')}` });
    return { rows: result, errors };
  }

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const name = row['name'] ?? '';
    const project_name = row['project_name'] ?? '';
    const status = row['status'] || 'backlog';

    if (!name) {
      errors.push({ row: rowNum, message: 'name is required' });
      return;
    }
    if (name.length > MAX_NAME_LENGTH) {
      errors.push({ row: rowNum, message: `name must be ${MAX_NAME_LENGTH} characters or less` });
      return;
    }
    if (!project_name) {
      errors.push({ row: rowNum, message: 'project_name is required' });
      return;
    }
    if (!VALID_EPIC_STATUSES.includes(status as (typeof VALID_EPIC_STATUSES)[number])) {
      errors.push({
        row: rowNum,
        message: `invalid status "${status}". Must be one of: ${VALID_EPIC_STATUSES.join(', ')}`,
      });
      return;
    }

    result.push({ name, project_name, status });
  });

  return { rows: result, errors };
}

export function parseIssuesCsv(text: string): ParseResult<ParsedIssue> {
  const { headers, rows } = parseCsvRows(text);
  const errors: ParseError[] = [];
  const result: ParsedIssue[] = [];

  const missingCols = ['title', 'project_name'].filter((c) => !headers.includes(c));
  if (missingCols.length > 0) {
    errors.push({ row: 0, message: `Missing required columns: ${missingCols.join(', ')}` });
    return { rows: result, errors };
  }

  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const title = row['title'] ?? '';
    const project_name = row['project_name'] ?? '';
    const epic_name = row['epic_name'] || 'Unassigned';
    const status = row['status'] || 'todo';
    const priorityStr = row['priority'] ?? '';
    const storyPointsStr = row['story_points'] ?? '';

    if (!title) {
      errors.push({ row: rowNum, message: 'title is required' });
      return;
    }
    if (title.length > MAX_ISSUE_TITLE_LENGTH) {
      errors.push({
        row: rowNum,
        message: `title must be ${MAX_ISSUE_TITLE_LENGTH} characters or less`,
      });
      return;
    }
    if (!project_name) {
      errors.push({ row: rowNum, message: 'project_name is required' });
      return;
    }
    if (!VALID_ISSUE_STATUSES.includes(status as (typeof VALID_ISSUE_STATUSES)[number])) {
      errors.push({
        row: rowNum,
        message: `invalid status "${status}". Must be one of: ${VALID_ISSUE_STATUSES.join(', ')}`,
      });
      return;
    }

    let priority = DEFAULT_ISSUE_PRIORITY;
    if (priorityStr !== '') {
      const p = parseInt(priorityStr);
      if (isNaN(p) || p < 0 || p > 3) {
        errors.push({ row: rowNum, message: 'priority must be 0, 1, 2, or 3' });
        return;
      }
      priority = p;
    }

    let story_points: number | null = null;
    if (storyPointsStr !== '') {
      const sp = parseInt(storyPointsStr);
      if (!VALID_STORY_POINTS.includes(sp as (typeof VALID_STORY_POINTS)[number])) {
        errors.push({
          row: rowNum,
          message: `story_points must be one of: ${VALID_STORY_POINTS.join(', ')}`,
        });
        return;
      }
      story_points = sp;
    }

    result.push({ title, project_name, epic_name, status, priority, story_points });
  });

  return { rows: result, errors };
}

export const CSV_TEMPLATES: Record<ImportEntityType, string> = {
  projects: 'name,status\nMy Project,active\nAnother Project,backlog\n',
  epics: 'name,project_name,status\nEpic 1,My Project,active\nEpic 2,My Project,backlog\n',
  issues:
    'title,project_name,epic_name,status,priority,story_points\nFix bug,My Project,Epic 1,todo,2,3\nNew feature,My Project,Unassigned,backlog,1,\n',
};
