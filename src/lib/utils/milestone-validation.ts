/**
 * Milestone Validation Utilities
 *
 * Validation functions for milestone creation and updates.
 * Follows validation patterns from issue-helpers.ts
 */

/**
 * Validates milestone name
 *
 * Requirements:
 * - Non-empty after trimming
 * - Maximum 100 characters (matching project name validation)
 *
 * @param name - Milestone name to validate
 * @returns true if valid, false otherwise
 */
export function validateMilestoneName(name: string | null | undefined): boolean {
  if (!name || typeof name !== 'string') {
    return false;
  }

  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return false;
  }

  if (trimmed.length > 100) {
    return false;
  }

  return true;
}
