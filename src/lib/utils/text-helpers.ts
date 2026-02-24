/**
 * Text utility functions for content normalization
 */

/**
 * Normalize rich text HTML to detect meaningful content changes.
 * Strips zero-width spaces, normalizes nbsp entities, removes HTML tags,
 * and collapses whitespace.
 *
 * Returns empty string if no meaningful text content exists.
 * Returns normalized HTML (with nbsp preserved) if text content exists.
 *
 * This prevents false-positive saves when rich text editor changes
 * HTML structure without changing actual content.
 */
export function normalizeDescription(value: string | null | undefined): string {
  const trimmed = (value ?? '').replace(/\u200B/g, '').trim();
  if (!trimmed) return '';

  const withoutNbsp = trimmed.replace(/&nbsp;/gi, ' ').trim();
  const textOnly = withoutNbsp
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!textOnly) return '';
  return withoutNbsp;
}
