/**
 * Project Helper Utilities
 *
 * Utility functions for project-level computations including story point aggregation.
 */

import type { Issue } from '$lib/types';

export interface ProjectMetrics {
  totalIssues: number;
  activeStoryPoints: number; // Sum of Ready + Doing issues' story points
  totalStoryPoints: number; // Sum of all non-null story points
}

/**
 * Compute story points and issue count metrics for a project
 *
 * @param issues - Array of issues belonging to the project
 * @returns ProjectMetrics object with computed values
 */
export function computeProjectMetrics(issues: Issue[]): ProjectMetrics {
  const totalIssues = issues.length;

  let activeStoryPoints = 0;
  let totalStoryPoints = 0;

  for (const issue of issues) {
    if (issue.story_points !== null) {
      totalStoryPoints += issue.story_points;

      // Active = Ready (todo) + Doing
      if (issue.status === 'todo' || issue.status === 'doing') {
        activeStoryPoints += issue.story_points;
      }
    }
  }

  return {
    totalIssues,
    activeStoryPoints,
    totalStoryPoints,
  };
}
