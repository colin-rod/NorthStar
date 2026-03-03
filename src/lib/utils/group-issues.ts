// src/lib/utils/group-issues.ts
import type { Issue } from '$lib/types';

export interface IssueGroup {
  label?: string;
  items: Issue[];
  count: number;
  groupKey: string;
}

export function groupIssues(issues: Issue[], groupBy: string): IssueGroup[] {
  if (groupBy === 'none') {
    return [{ items: issues, count: issues.length, groupKey: 'all' }];
  }

  const groups = new Map<string, Issue[]>();

  for (const issue of issues) {
    const { key } = getGroupKeyAndLabel(issue, groupBy);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    const group = groups.get(key);
    if (group) {
      group.push(issue);
    }
  }

  const groupArray = Array.from(groups.entries()).map(([key, items]) => {
    const { label } = getGroupKeyAndLabel(items[0], groupBy);
    return {
      label,
      items,
      count: items.length,
      groupKey: key,
    };
  });

  return groupArray.sort((a, b) => compareGroupKeys(a.groupKey, b.groupKey, groupBy));
}

function getGroupKeyAndLabel(issue: Issue, groupBy: string): { key: string; label: string } {
  switch (groupBy) {
    case 'priority':
      return { key: `p${issue.priority}`, label: `P${issue.priority}` };
    case 'status':
      return { key: issue.status, label: formatStatus(issue.status) };
    case 'story_points':
      if (issue.story_points === null) {
        return { key: 'none', label: 'No story points' };
      }
      return {
        key: `sp${issue.story_points}`,
        label: issue.story_points === 1 ? '1 point' : `${issue.story_points} points`,
      };
    case 'milestone':
      if (issue.milestone_id === null) {
        return { key: 'none', label: 'No milestone' };
      }
      return { key: issue.milestone_id, label: issue.milestone?.name || 'Unknown' };
    default:
      return { key: 'unknown', label: 'Unknown' };
  }
}

function formatStatus(status: string): string {
  const map: Record<string, string> = {
    todo: 'Todo',
    backlog: 'Backlog',
    in_progress: 'In Progress',
    in_review: 'In Review',
    done: 'Done',
    canceled: 'Canceled',
  };
  return map[status] || status;
}

function compareGroupKeys(a: string, b: string, groupBy: string): number {
  if (groupBy === 'priority') {
    // P0, P1, P2, P3
    return a.localeCompare(b);
  }
  if (groupBy === 'status') {
    // backlog, todo, in_progress, in_review, done, canceled
    const statusOrder = ['backlog', 'todo', 'in_progress', 'in_review', 'done', 'canceled'];
    return statusOrder.indexOf(a) - statusOrder.indexOf(b);
  }
  if (groupBy === 'story_points') {
    // 1, 2, 3, 5, 8, 13, 21, none
    if (a === 'none') return 1;
    if (b === 'none') return -1;
    const aVal = parseInt(a.replace('sp', ''), 10);
    const bVal = parseInt(b.replace('sp', ''), 10);
    return aVal - bVal;
  }
  return a.localeCompare(b);
}
