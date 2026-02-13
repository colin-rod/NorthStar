import { describe, it, expect } from 'vitest';

import { parseProjectIds, parsePriorities, parseMilestones } from '$lib/utils/url-helpers';

describe('parseProjectIds', () => {
  it('should return empty array for null', () => {
    expect(parseProjectIds(null)).toEqual([]);
  });

  it('should return empty array for empty string', () => {
    expect(parseProjectIds('')).toEqual([]);
  });

  it('should parse single project ID', () => {
    expect(parseProjectIds('abc-123')).toEqual(['abc-123']);
  });

  it('should parse multiple project IDs', () => {
    expect(parseProjectIds('id1,id2,id3')).toEqual(['id1', 'id2', 'id3']);
  });

  it('should trim whitespace', () => {
    expect(parseProjectIds(' id1 , id2 , id3 ')).toEqual(['id1', 'id2', 'id3']);
  });

  it('should filter empty strings', () => {
    expect(parseProjectIds('id1,,id2,,,id3')).toEqual(['id1', 'id2', 'id3']);
  });
});

describe('parsePriorities', () => {
  it('should return empty array for null', () => {
    expect(parsePriorities(null)).toEqual([]);
  });

  it('should return empty array for empty string', () => {
    expect(parsePriorities('')).toEqual([]);
  });

  it('should parse single priority', () => {
    expect(parsePriorities('0')).toEqual([0]);
    expect(parsePriorities('1')).toEqual([1]);
    expect(parsePriorities('2')).toEqual([2]);
    expect(parsePriorities('3')).toEqual([3]);
  });

  it('should parse multiple priorities', () => {
    expect(parsePriorities('0,1,2')).toEqual([0, 1, 2]);
    expect(parsePriorities('1,3')).toEqual([1, 3]);
  });

  it('should trim whitespace', () => {
    expect(parsePriorities(' 0 , 1 , 2 ')).toEqual([0, 1, 2]);
  });

  it('should filter invalid priorities (< 0)', () => {
    expect(parsePriorities('-1,0,1')).toEqual([0, 1]);
  });

  it('should filter invalid priorities (> 3)', () => {
    expect(parsePriorities('0,1,4,5')).toEqual([0, 1]);
  });

  it('should filter non-numeric values', () => {
    expect(parsePriorities('0,abc,1')).toEqual([0, 1]);
    expect(parsePriorities('invalid')).toEqual([]);
  });

  it('should handle duplicate priorities', () => {
    expect(parsePriorities('0,0,1,1')).toEqual([0, 0, 1, 1]);
  });
});

describe('parseMilestones', () => {
  it('should return empty arrays for null', () => {
    expect(parseMilestones(null)).toEqual({
      milestoneIds: [],
      includeNoMilestone: false,
    });
  });

  it('should return empty arrays for empty string', () => {
    expect(parseMilestones('')).toEqual({
      milestoneIds: [],
      includeNoMilestone: false,
    });
  });

  it('should parse single milestone ID', () => {
    expect(parseMilestones('abc-123')).toEqual({
      milestoneIds: ['abc-123'],
      includeNoMilestone: false,
    });
  });

  it('should parse multiple milestone IDs', () => {
    expect(parseMilestones('id1,id2,id3')).toEqual({
      milestoneIds: ['id1', 'id2', 'id3'],
      includeNoMilestone: false,
    });
  });

  it('should parse "none" as includeNoMilestone flag', () => {
    expect(parseMilestones('none')).toEqual({
      milestoneIds: [],
      includeNoMilestone: true,
    });
  });

  it('should parse milestone IDs and "none" together', () => {
    expect(parseMilestones('id1,none,id2')).toEqual({
      milestoneIds: ['id1', 'id2'],
      includeNoMilestone: true,
    });
  });

  it('should trim whitespace', () => {
    expect(parseMilestones(' id1 , id2 , none ')).toEqual({
      milestoneIds: ['id1', 'id2'],
      includeNoMilestone: true,
    });
  });

  it('should filter empty strings', () => {
    expect(parseMilestones('id1,,id2,,,none')).toEqual({
      milestoneIds: ['id1', 'id2'],
      includeNoMilestone: true,
    });
  });

  it('should handle multiple "none" values', () => {
    expect(parseMilestones('none,none,id1')).toEqual({
      milestoneIds: ['id1'],
      includeNoMilestone: true,
    });
  });
});
