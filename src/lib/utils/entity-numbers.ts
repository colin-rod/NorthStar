/**
 * Entity Number Formatting Utilities
 *
 * Format entity numbers with prefixes for display in UI.
 * Numbers are stored as integers in database, formatted with prefixes in UI.
 *
 * Examples:
 * - Projects: P-1, P-2, P-3
 * - Epics: E-1, E-2, E-3
 * - Issues: I-1, I-2, I-3
 */

/**
 * Format project number with P- prefix
 *
 * @param number - Project number from database
 * @returns Formatted string like "P-1"
 */
export function formatProjectNumber(number: number): string {
  return `P-${number}`;
}

/**
 * Format epic number with E- prefix
 *
 * @param number - Epic number from database
 * @returns Formatted string like "E-1"
 */
export function formatEpicNumber(number: number): string {
  return `E-${number}`;
}

/**
 * Format issue number with I- prefix
 *
 * @param number - Issue number from database
 * @returns Formatted string like "I-1"
 */
export function formatIssueNumber(number: number): string {
  return `I-${number}`;
}

/**
 * Format entity with number and title
 *
 * @param type - Entity type ('project', 'epic', or 'issue')
 * @param number - Entity number from database
 * @param name - Entity name/title
 * @returns Formatted string like "I-123: Fix login bug"
 *
 * @example
 * formatEntityTitle('project', 1, 'My Project') // "P-1: My Project"
 * formatEntityTitle('epic', 42, 'Backend Work') // "E-42: Backend Work"
 * formatEntityTitle('issue', 123, 'Fix login bug') // "I-123: Fix login bug"
 */
export function formatEntityTitle(
  type: 'project' | 'epic' | 'issue',
  number: number,
  name: string,
): string {
  const prefix = type === 'project' ? 'P' : type === 'epic' ? 'E' : 'I';
  return `${prefix}-${number}: ${name}`;
}
