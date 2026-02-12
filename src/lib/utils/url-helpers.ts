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
