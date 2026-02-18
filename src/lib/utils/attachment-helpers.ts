/**
 * Utility functions for file attachments.
 */

/**
 * Format a file size in bytes to a human-readable string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Build a storage path for an attachment.
 * Format: {userId}/{entityType}/{entityId}/{uuid}-{fileName}
 */
export function buildStoragePath(
  userId: string,
  entityType: string,
  entityId: string,
  fileName: string,
): string {
  return `${userId}/${entityType}/${entityId}/${crypto.randomUUID()}-${fileName}`;
}

/**
 * Check if a MIME type represents an image file.
 */
export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}
