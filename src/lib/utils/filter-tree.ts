import type { Project, Epic, Issue, ProjectStatus, EpicStatus, IssueStatus } from '$lib/types';

export interface TreeFilters {
  projectStatus: ProjectStatus[];
  epicStatus: EpicStatus[];
  issuePriority: number[];
  issueStatus: IssueStatus[];
  issueStoryPoints: (number | null)[];
}

export function filterTree(projects: Project[], filters: TreeFilters): Project[] {
  return projects
    .filter((project) => matchesProjectFilter(project, filters))
    .map((project) => ({
      ...project,
      epics: (project.epics || [])
        .filter((epic) => matchesEpicFilter(epic, filters))
        .map((epic) => ({
          ...epic,
          issues: (epic.issues || []).filter((issue) => matchesIssueFilter(issue, filters)),
        })),
    }));
}

function matchesProjectFilter(project: Project, filters: TreeFilters): boolean {
  if (filters.projectStatus.length > 0 && !filters.projectStatus.includes(project.status)) {
    return false;
  }
  return true;
}

function matchesEpicFilter(epic: Epic, filters: TreeFilters): boolean {
  if (filters.epicStatus.length > 0 && !filters.epicStatus.includes(epic.status)) {
    return false;
  }
  return true;
}

function matchesIssueFilter(issue: Issue, filters: TreeFilters): boolean {
  if (filters.issuePriority.length > 0 && !filters.issuePriority.includes(issue.priority)) {
    return false;
  }
  if (filters.issueStatus.length > 0 && !filters.issueStatus.includes(issue.status)) {
    return false;
  }
  if (filters.issueStoryPoints.length > 0) {
    const hasNone = filters.issueStoryPoints.includes(null);
    const pointValues = filters.issueStoryPoints.filter((p) => p !== null);

    if (issue.story_points === null) {
      if (!hasNone) return false;
    } else {
      if (!pointValues.includes(issue.story_points)) return false;
    }
  }
  return true;
}
