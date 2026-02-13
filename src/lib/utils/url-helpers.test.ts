/**
 * URL Helpers Tests
 *
 * Tests for URL query parameter parsing utilities.
 */

import { describe, it, expect } from 'vitest';

import { parseProjectIds, parsePriorities, parseMilestones } from './url-helpers';

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

describe('parsePriorities', () => {
  it('returns empty array for null', () => {
    expect(parsePriorities(null)).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    expect(parsePriorities('')).toEqual([]);
  });

  it('parses single priority', () => {
    expect(parsePriorities('0')).toEqual([0]);
    expect(parsePriorities('1')).toEqual([1]);
    expect(parsePriorities('2')).toEqual([2]);
    expect(parsePriorities('3')).toEqual([3]);
  });

  it('parses multiple priorities', () => {
    expect(parsePriorities('0,1,2')).toEqual([0, 1, 2]);
    expect(parsePriorities('1,3')).toEqual([1, 3]);
  });

  it('trims whitespace', () => {
    expect(parsePriorities(' 0 , 1 , 2 ')).toEqual([0, 1, 2]);
  });

  it('filters invalid priorities (< 0)', () => {
    expect(parsePriorities('-1,0,1')).toEqual([0, 1]);
  });

  it('filters invalid priorities (> 3)', () => {
    expect(parsePriorities('0,1,4,5')).toEqual([0, 1]);
  });

  it('filters non-numeric values', () => {
    expect(parsePriorities('0,abc,1')).toEqual([0, 1]);
    expect(parsePriorities('invalid')).toEqual([]);
  });

  it('handles duplicate priorities', () => {
    expect(parsePriorities('0,0,1,1')).toEqual([0, 0, 1, 1]);
  });
});

describe('parseMilestones', () => {
  it('returns empty arrays for null', () => {
    expect(parseMilestones(null)).toEqual({
      milestoneIds: [],
      includeNoMilestone: false,
    });
  });

  it('returns empty arrays for empty string', () => {
    expect(parseMilestones('')).toEqual({
      milestoneIds: [],
      includeNoMilestone: false,
    });
  });

  it('parses single milestone ID', () => {
    expect(parseMilestones('abc-123')).toEqual({
      milestoneIds: ['abc-123'],
      includeNoMilestone: false,
    });
  });

  it('parses multiple milestone IDs', () => {
    expect(parseMilestones('id1,id2,id3')).toEqual({
      milestoneIds: ['id1', 'id2', 'id3'],
      includeNoMilestone: false,
    });
  });

  it('parses "none" as includeNoMilestone flag', () => {
    expect(parseMilestones('none')).toEqual({
      milestoneIds: [],
      includeNoMilestone: true,
    });
  });

  it('parses milestone IDs and "none" together', () => {
    expect(parseMilestones('id1,none,id2')).toEqual({
      milestoneIds: ['id1', 'id2'],
      includeNoMilestone: true,
    });
  });

  it('trims whitespace', () => {
    expect(parseMilestones(' id1 , id2 , none ')).toEqual({
      milestoneIds: ['id1', 'id2'],
      includeNoMilestone: true,
    });
  });

  it('filters empty strings', () => {
    expect(parseMilestones('id1,,id2,,,none')).toEqual({
      milestoneIds: ['id1', 'id2'],
      includeNoMilestone: true,
    });
  });

  it('handles multiple "none" values', () => {
    expect(parseMilestones('none,none,id1')).toEqual({
      milestoneIds: ['id1'],
      includeNoMilestone: true,
    });
  });
});
