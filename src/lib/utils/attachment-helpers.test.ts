import { describe, it, expect } from 'vitest';

import {
  formatFileSize,
  buildStoragePath,
  isImageFile,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_MIME_TYPES,
} from '$lib/utils/attachment-helpers';

describe('formatFileSize', () => {
  it('formats bytes correctly', () => {
    expect(formatFileSize(500)).toBe('500 B');
  });

  it('formats kilobytes correctly', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB');
  });

  it('formats megabytes correctly', () => {
    expect(formatFileSize(1048576)).toBe('1.0 MB');
  });

  it('formats gigabytes correctly', () => {
    expect(formatFileSize(1073741824)).toBe('1.0 GB');
  });

  it('formats fractional kilobytes correctly', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });

  it('handles zero bytes', () => {
    expect(formatFileSize(0)).toBe('0 B');
  });
});

describe('buildStoragePath', () => {
  it('builds a valid storage path', () => {
    const path = buildStoragePath('user-1', 'issue', 'issue-1', 'file.pdf');
    expect(path).toMatch(/^user-1\/issue\/issue-1\/.+-file\.pdf$/);
  });

  it('includes all path segments', () => {
    const path = buildStoragePath('user-abc', 'project', 'proj-xyz', 'doc.png');
    expect(path.startsWith('user-abc/project/proj-xyz/')).toBe(true);
    expect(path.endsWith('-doc.png')).toBe(true);
  });

  it('generates unique paths for the same file', () => {
    const path1 = buildStoragePath('user-1', 'issue', 'issue-1', 'file.pdf');
    const path2 = buildStoragePath('user-1', 'issue', 'issue-1', 'file.pdf');
    expect(path1).not.toBe(path2);
  });
});

describe('MAX_FILE_SIZE_BYTES', () => {
  it('is 10MB', () => {
    expect(MAX_FILE_SIZE_BYTES).toBe(10 * 1024 * 1024);
  });
});

describe('ALLOWED_MIME_TYPES', () => {
  it('allows common image types', () => {
    expect(ALLOWED_MIME_TYPES.has('image/jpeg')).toBe(true);
    expect(ALLOWED_MIME_TYPES.has('image/png')).toBe(true);
    expect(ALLOWED_MIME_TYPES.has('image/gif')).toBe(true);
    expect(ALLOWED_MIME_TYPES.has('image/webp')).toBe(true);
    expect(ALLOWED_MIME_TYPES.has('image/svg+xml')).toBe(true);
  });

  it('allows PDF and office document types', () => {
    expect(ALLOWED_MIME_TYPES.has('application/pdf')).toBe(true);
    expect(
      ALLOWED_MIME_TYPES.has(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ),
    ).toBe(true);
    expect(
      ALLOWED_MIME_TYPES.has('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
    ).toBe(true);
  });

  it('allows text types', () => {
    expect(ALLOWED_MIME_TYPES.has('text/plain')).toBe(true);
    expect(ALLOWED_MIME_TYPES.has('text/csv')).toBe(true);
    expect(ALLOWED_MIME_TYPES.has('text/markdown')).toBe(true);
  });

  it('allows archive types', () => {
    expect(ALLOWED_MIME_TYPES.has('application/zip')).toBe(true);
  });

  it('rejects executable and script types', () => {
    expect(ALLOWED_MIME_TYPES.has('application/x-executable')).toBe(false);
    expect(ALLOWED_MIME_TYPES.has('application/javascript')).toBe(false);
    expect(ALLOWED_MIME_TYPES.has('text/html')).toBe(false);
    expect(ALLOWED_MIME_TYPES.has('application/x-sh')).toBe(false);
  });
});

describe('isImageFile', () => {
  it('returns true for image/jpeg', () => {
    expect(isImageFile('image/jpeg')).toBe(true);
  });

  it('returns true for image/png', () => {
    expect(isImageFile('image/png')).toBe(true);
  });

  it('returns true for image/gif', () => {
    expect(isImageFile('image/gif')).toBe(true);
  });

  it('returns true for image/webp', () => {
    expect(isImageFile('image/webp')).toBe(true);
  });

  it('returns false for application/pdf', () => {
    expect(isImageFile('application/pdf')).toBe(false);
  });

  it('returns false for text/plain', () => {
    expect(isImageFile('text/plain')).toBe(false);
  });

  it('returns false for application/zip', () => {
    expect(isImageFile('application/zip')).toBe(false);
  });
});
