import type { Issue } from '$lib/types';
import { isBlocked } from '$lib/utils/issue-helpers';

export interface IssueBuckets {
  todoIssues: Issue[];
  doingIssues: Issue[];
  inReviewIssues: Issue[];
  blockedIssues: Issue[];
  doneIssues: Issue[];
  canceledIssues: Issue[];
}

export function bucketIssues(issues: Issue[]): IssueBuckets {
  return {
    todoIssues: issues.filter((i) => i.status === 'todo' && !isBlocked(i)),
    doingIssues: issues.filter((i) => i.status === 'in_progress'),
    inReviewIssues: issues.filter((i) => i.status === 'in_review'),
    blockedIssues: issues.filter((i) => isBlocked(i)),
    doneIssues: issues.filter((i) => i.status === 'done'),
    canceledIssues: issues.filter((i) => i.status === 'canceled'),
  };
}
