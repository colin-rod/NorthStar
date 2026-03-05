/**
 * Utility functions for file attachments.
 */

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const ALLOWED_MIME_TYPES = new Set([
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // Text
  'text/plain',
  'text/markdown',
  'text/csv',
  // Archives
  'application/zip',
  'application/x-zip-compressed',
]);

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
