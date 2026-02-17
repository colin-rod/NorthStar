import { describe, it, expect } from 'vitest';

import { formatFileSize, buildStoragePath, isImageFile } from '$lib/utils/attachment-helpers';

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
