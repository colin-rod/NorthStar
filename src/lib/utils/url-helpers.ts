/**
 * URL Helpers
 *
 * Utilities for parsing and manipulating URL query parameters.
 */

/**
 * Parse project IDs from URL query parameter
 * @param param - Comma-separated project IDs from query string
 * @returns Array of project ID strings
 */
export function parseProjectIds(param: string | null): string[] {
  if (!param || param.trim().length === 0) {
    return [];
  }

  return param
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
}

/**
 * Parse priority filter from URL param
 * @param param - "0,1,2" or null
 * @returns [0, 1, 2] or []
 */
export function parsePriorities(param: string | null): number[] {
  if (!param || param.trim().length === 0) {
    return [];
  }

  return param
    .split(',')
    .map((p) => parseInt(p.trim(), 10))
    .filter((p) => !isNaN(p) && p >= 0 && p <= 3);
}

/**
 * Parse milestone filter from URL param
 * @param param - "uuid1,uuid2,none" or null
 * @returns { milestoneIds: string[], includeNoMilestone: boolean }
 */
export function parseMilestones(param: string | null): {
  milestoneIds: string[];
  includeNoMilestone: boolean;
} {
  if (!param || param.trim().length === 0) {
    return { milestoneIds: [], includeNoMilestone: false };
  }

  const parts = param
    .split(',')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const includeNoMilestone = parts.includes('none');
  const milestoneIds = parts.filter((p) => p !== 'none');

  return { milestoneIds, includeNoMilestone };
}

/**
 * Parse status filter from URL param
 * @param param - "todo,doing,done" or null
 * @returns ['todo', 'doing', 'done'] or []
 */
export function parseStatuses(param: string | null): string[] {
  if (!param || param.trim().length === 0) {
    return [];
  }

  const validStatuses = ['todo', 'doing', 'in_review', 'done', 'canceled'];

  return param
    .split(',')
    .map((s) => s.trim())
    .filter((s) => validStatuses.includes(s));
}

/**
 * Parse story points filter from URL param
 * @param param - "1,5,8,none" or null
 * @returns ['1', '5', '8', 'none'] or [] (strings for ease of "none" handling)
 */
export function parseStoryPoints(param: string | null): string[] {
  if (!param || param.trim().length === 0) {
    return [];
  }

  const validPoints = ['1', '2', '3', '5', '8', '13', '21', 'none'];

  return param
    .split(',')
    .map((p) => p.trim())
    .filter((p) => validPoints.includes(p));
}
