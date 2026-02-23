/**
 * Sort Tree
 *
 * Context-aware sorting for Projects → Epics → Issues hierarchy.
 * Sorts at all three levels based on the selected mode.
 */

import type { Project, Epic, Issue } from '$lib/types';

export type SortByMode = 'priority' | 'status' | 'name' | 'title' | 'story_points' | 'progress';
export type SortDirection = 'asc' | 'desc';

// Status sort order constants
const PROJECT_STATUS_ORDER = { active: 0, done: 1, canceled: 2 } as const;
const EPIC_STATUS_ORDER = { active: 0, done: 1, canceled: 2 } as const;
const ISSUE_STATUS_ORDER = { todo: 0, doing: 1, in_review: 2, done: 3, canceled: 4 } as const;

/**
 * Sort projects tree by the specified mode and direction
 *
 * @param projects - Array of projects with nested epics and issues
 * @param sortBy - Sorting mode
 * @param direction - Sort direction (asc or desc)
 * @returns New sorted array (does not mutate original)
 */
export function sortTree(
  projects: Project[],
  sortBy: SortByMode,
  direction: SortDirection,
): Project[] {
  // Create deep copy to avoid mutation
  const projectsCopy = structuredClone(projects);

  // Sort projects
  const sortedProjects = sortProjects(projectsCopy, sortBy, direction);

  // Sort nested epics and issues
  for (const project of sortedProjects) {
    if (project.epics) {
      project.epics = sortEpics(project.epics, sortBy, direction);

      for (const epic of project.epics) {
        if (epic.issues) {
          epic.issues = sortIssues(epic.issues, sortBy, direction);
        }
      }
    }
  }

  return sortedProjects;
}

/**
 * Sort projects array
 */
function sortProjects(
  projects: Project[],
  sortBy: SortByMode,
  direction: SortDirection,
): Project[] {
  const sorted = [...projects].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'priority':
        comparison = compareByHighestPriority(a, b);
        break;
      case 'status':
        comparison = compareProjectStatus(a, b);
        break;
      case 'name':
      case 'title':
        comparison = compareString(a.name, b.name);
        break;
      case 'story_points':
        comparison = compareTotalStoryPoints(a, b);
        break;
      case 'progress':
        comparison = compareProgress(a, b);
        break;
    }

    return direction === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

/**
 * Sort epics array
 */
function sortEpics(epics: Epic[], sortBy: SortByMode, direction: SortDirection): Epic[] {
  const sorted = [...epics].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'priority':
        comparison = compareEpicsByHighestPriority(a, b);
        break;
      case 'status':
        comparison = compareEpicStatus(a, b);
        break;
      case 'name':
      case 'title':
        comparison = compareString(a.name, b.name);
        break;
      case 'story_points':
        comparison = compareEpicTotalStoryPoints(a, b);
        break;
      case 'progress':
        comparison = compareEpicProgress(a, b);
        break;
    }

    return direction === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

/**
 * Sort issues array
 */
function sortIssues(issues: Issue[], sortBy: SortByMode, direction: SortDirection): Issue[] {
  const sorted = [...issues].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'priority':
        comparison = a.priority - b.priority;
        break;
      case 'status':
        comparison = compareIssueStatus(a, b);
        break;
      case 'name':
      case 'title':
        comparison = compareString(a.title, b.title);
        break;
      case 'story_points':
        comparison = compareStoryPoints(a.story_points, b.story_points);
        break;
      case 'progress':
        // Issues don't have progress, maintain original order
        comparison = 0;
        break;
    }

    return direction === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

/**
 * Compare projects by highest priority issue
 */
function compareByHighestPriority(a: Project, b: Project): number {
  const aHighest = getHighestPriorityFromProject(a);
  const bHighest = getHighestPriorityFromProject(b);

  // No issues: sort to end
  if (aHighest === null && bHighest === null) return 0;
  if (aHighest === null) return 1;
  if (bHighest === null) return -1;

  return aHighest - bHighest;
}

/**
 * Compare epics by highest priority issue
 */
function compareEpicsByHighestPriority(a: Epic, b: Epic): number {
  const aHighest = getHighestPriorityFromEpic(a);
  const bHighest = getHighestPriorityFromEpic(b);

  // No issues: sort to end
  if (aHighest === null && bHighest === null) return 0;
  if (aHighest === null) return 1;
  if (bHighest === null) return -1;

  return aHighest - bHighest;
}

/**
 * Get highest priority (lowest number) from project's issues
 */
function getHighestPriorityFromProject(project: Project): number | null {
  if (!project.epics || project.epics.length === 0) return null;

  let highest: number | null = null;
  for (const epic of project.epics) {
    const epicHighest = getHighestPriorityFromEpic(epic);
    if (epicHighest !== null && (highest === null || epicHighest < highest)) {
      highest = epicHighest;
    }
  }

  return highest;
}

/**
 * Get highest priority (lowest number) from epic's issues
 */
function getHighestPriorityFromEpic(epic: Epic): number | null {
  if (!epic.issues || epic.issues.length === 0) return null;

  let highest: number | null = null;
  for (const issue of epic.issues) {
    if (highest === null || issue.priority < highest) {
      highest = issue.priority;
    }
  }

  return highest;
}

/**
 * Compare project status
 * Order: active > done > canceled
 */
function compareProjectStatus(a: Project, b: Project): number {
  return PROJECT_STATUS_ORDER[a.status] - PROJECT_STATUS_ORDER[b.status];
}

/**
 * Compare epic status
 * Order: active > done > canceled
 */
function compareEpicStatus(a: Epic, b: Epic): number {
  return EPIC_STATUS_ORDER[a.status] - EPIC_STATUS_ORDER[b.status];
}

/**
 * Compare issue status
 * Order: todo > doing > in_review > done > canceled
 */
function compareIssueStatus(a: Issue, b: Issue): number {
  return ISSUE_STATUS_ORDER[a.status] - ISSUE_STATUS_ORDER[b.status];
}

/**
 * Compare strings case-insensitively
 */
function compareString(a: string, b: string): number {
  return a.toLowerCase().localeCompare(b.toLowerCase());
}

/**
 * Compare story points (null values sorted last in asc, first in desc)
 */
function compareStoryPoints(a: number | null, b: number | null): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1; // null goes last in asc
  if (b === null) return -1;
  return a - b;
}

/**
 * Compare projects by total story points
 */
function compareTotalStoryPoints(a: Project, b: Project): number {
  const aTotal = calculateProjectTotalStoryPoints(a);
  const bTotal = calculateProjectTotalStoryPoints(b);
  return aTotal - bTotal;
}

/**
 * Compare epics by total story points
 */
function compareEpicTotalStoryPoints(a: Epic, b: Epic): number {
  const aTotal = calculateEpicTotalStoryPoints(a);
  const bTotal = calculateEpicTotalStoryPoints(b);
  return aTotal - bTotal;
}

/**
 * Calculate total story points for a project
 */
function calculateProjectTotalStoryPoints(project: Project): number {
  if (!project.epics) return 0;
  return project.epics.reduce((sum, epic) => sum + calculateEpicTotalStoryPoints(epic), 0);
}

/**
 * Calculate total story points for an epic
 */
function calculateEpicTotalStoryPoints(epic: Epic): number {
  if (!epic.issues) return 0;
  return epic.issues.reduce((sum, issue) => sum + (issue.story_points || 0), 0);
}

/**
 * Compare projects by progress percentage
 */
function compareProgress(a: Project, b: Project): number {
  const aProgress = calculateProjectProgress(a);
  const bProgress = calculateProjectProgress(b);
  return aProgress - bProgress;
}

/**
 * Compare epics by progress percentage
 */
function compareEpicProgress(a: Epic, b: Epic): number {
  const aProgress = calculateEpicProgress(a);
  const bProgress = calculateEpicProgress(b);
  return aProgress - bProgress;
}

/**
 * Check if issue is complete (done or canceled)
 */
function isComplete(issue: Issue): boolean {
  return issue.status === 'done' || issue.status === 'canceled';
}

/**
 * Calculate progress percentage from story points or issue count
 */
function calculateProgressPercentage(
  totalPoints: number,
  completedPoints: number,
  totalCount: number,
  completedCount: number,
): number {
  if (totalPoints > 0) {
    return Math.round((completedPoints / totalPoints) * 100);
  }

  if (totalCount > 0) {
    return Math.round((completedCount / totalCount) * 100);
  }

  return 0;
}

/**
 * Calculate progress percentage for a project
 */
function calculateProjectProgress(project: Project): number {
  if (!project.epics || project.epics.length === 0) return 0;

  let totalPoints = 0;
  let completedPoints = 0;
  const allIssues: Issue[] = [];

  for (const epic of project.epics) {
    if (!epic.issues) continue;

    for (const issue of epic.issues) {
      allIssues.push(issue);
      const points = issue.story_points || 0;
      totalPoints += points;

      if (isComplete(issue)) {
        completedPoints += points;
      }
    }
  }

  const completedCount = allIssues.filter(isComplete).length;
  return calculateProgressPercentage(
    totalPoints,
    completedPoints,
    allIssues.length,
    completedCount,
  );
}

/**
 * Calculate progress percentage for an epic
 */
function calculateEpicProgress(epic: Epic): number {
  if (!epic.issues || epic.issues.length === 0) return 0;

  let totalPoints = 0;
  let completedPoints = 0;

  for (const issue of epic.issues) {
    const points = issue.story_points || 0;
    totalPoints += points;

    if (isComplete(issue)) {
      completedPoints += points;
    }
  }

  const completedCount = epic.issues.filter(isComplete).length;
  return calculateProgressPercentage(
    totalPoints,
    completedPoints,
    epic.issues.length,
    completedCount,
  );
}
