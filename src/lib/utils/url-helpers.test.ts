/**
 * URL Helpers Tests
 *
 * Tests for URL query parameter parsing utilities.
 */

import { describe, it, expect } from 'vitest';

import { parseProjectIds } from './url-helpers';

describe('parseProjectIds', () => {
  it('returns empty array for null param', () => {
    expect(parseProjectIds(null)).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    expect(parseProjectIds('')).toEqual([]);
  });

  it('splits comma-separated UUIDs', () => {
    const ids = 'uuid1,uuid2,uuid3';
    expect(parseProjectIds(ids)).toEqual(['uuid1', 'uuid2', 'uuid3']);
  });

  it('filters out empty strings from malformed input', () => {
    expect(parseProjectIds('uuid1,,uuid2')).toEqual(['uuid1', 'uuid2']);
  });

  it('trims whitespace from UUIDs', () => {
    expect(parseProjectIds('uuid1, uuid2 ,uuid3')).toEqual(['uuid1', 'uuid2', 'uuid3']);
  });
});
