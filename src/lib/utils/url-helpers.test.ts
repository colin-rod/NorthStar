/**
 * URL Helpers Tests
 *
 * Tests for URL query parameter parsing utilities.
 */

import { describe, it, expect } from 'vitest';

import {
  parseProjectIds,
  parsePriorities,
  parseMilestones,
  parseStatuses,
  parseStoryPoints,
} from './url-helpers';

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

describe('parseStatuses', () => {
  it('returns empty array for null', () => {
    expect(parseStatuses(null)).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    expect(parseStatuses('')).toEqual([]);
  });

  it('returns empty array for whitespace-only string', () => {
    expect(parseStatuses('   ')).toEqual([]);
  });

  it('parses single valid status', () => {
    expect(parseStatuses('todo')).toEqual(['todo']);
    expect(parseStatuses('doing')).toEqual(['doing']);
    expect(parseStatuses('in_review')).toEqual(['in_review']);
    expect(parseStatuses('done')).toEqual(['done']);
    expect(parseStatuses('canceled')).toEqual(['canceled']);
  });

  it('parses multiple valid statuses', () => {
    expect(parseStatuses('todo,doing')).toEqual(['todo', 'doing']);
    expect(parseStatuses('todo,in_review,done')).toEqual(['todo', 'in_review', 'done']);
  });

  it('filters out invalid status values', () => {
    expect(parseStatuses('todo,invalid,doing')).toEqual(['todo', 'doing']);
    expect(parseStatuses('invalid')).toEqual([]);
    expect(parseStatuses('todo,bad,unknown,done')).toEqual(['todo', 'done']);
  });

  it('trims whitespace from status values', () => {
    expect(parseStatuses('  todo  , doing  ')).toEqual(['todo', 'doing']);
    expect(parseStatuses(' in_review , done ')).toEqual(['in_review', 'done']);
  });

  it('filters out empty strings from malformed input', () => {
    expect(parseStatuses('todo,,doing')).toEqual(['todo', 'doing']);
    expect(parseStatuses(',,,todo,,')).toEqual(['todo']);
  });

  it('preserves duplicate statuses', () => {
    expect(parseStatuses('todo,todo,doing')).toEqual(['todo', 'todo', 'doing']);
  });

  it('handles all valid statuses together', () => {
    expect(parseStatuses('todo,doing,in_review,done,canceled')).toEqual([
      'todo',
      'doing',
      'in_review',
      'done',
      'canceled',
    ]);
  });
});

describe('parseStoryPoints', () => {
  it('returns empty array for null', () => {
    expect(parseStoryPoints(null)).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    expect(parseStoryPoints('')).toEqual([]);
  });

  it('returns empty array for whitespace-only string', () => {
    expect(parseStoryPoints('   ')).toEqual([]);
  });

  it('parses single valid point value', () => {
    expect(parseStoryPoints('1')).toEqual(['1']);
    expect(parseStoryPoints('2')).toEqual(['2']);
    expect(parseStoryPoints('3')).toEqual(['3']);
    expect(parseStoryPoints('5')).toEqual(['5']);
    expect(parseStoryPoints('8')).toEqual(['8']);
    expect(parseStoryPoints('13')).toEqual(['13']);
    expect(parseStoryPoints('21')).toEqual(['21']);
  });

  it('parses multiple valid point values', () => {
    expect(parseStoryPoints('1,3,5')).toEqual(['1', '3', '5']);
    expect(parseStoryPoints('5,8,13')).toEqual(['5', '8', '13']);
  });

  it('parses "none" special value', () => {
    expect(parseStoryPoints('none')).toEqual(['none']);
  });

  it('parses point values and "none" together', () => {
    expect(parseStoryPoints('none,5')).toEqual(['none', '5']);
    expect(parseStoryPoints('1,none,8')).toEqual(['1', 'none', '8']);
  });

  it('filters out invalid point values', () => {
    expect(parseStoryPoints('1,4,5')).toEqual(['1', '5']); // 4 is invalid
    expect(parseStoryPoints('0,1,2')).toEqual(['1', '2']); // 0 is invalid
    expect(parseStoryPoints('10,13,15')).toEqual(['13']); // 10 and 15 are invalid
  });

  it('trims whitespace from point values', () => {
    expect(parseStoryPoints('  1  , 5  ')).toEqual(['1', '5']);
    expect(parseStoryPoints(' none , 8 ')).toEqual(['none', '8']);
  });

  it('filters out empty strings from malformed input', () => {
    expect(parseStoryPoints('1,,5')).toEqual(['1', '5']);
    expect(parseStoryPoints(',,,none,,')).toEqual(['none']);
  });

  it('preserves duplicate point values', () => {
    expect(parseStoryPoints('5,5,8')).toEqual(['5', '5', '8']);
    expect(parseStoryPoints('none,none,1')).toEqual(['none', 'none', '1']);
  });

  it('handles all valid point values together', () => {
    expect(parseStoryPoints('1,2,3,5,8,13,21')).toEqual(['1', '2', '3', '5', '8', '13', '21']);
  });

  it('handles all valid values including none', () => {
    expect(parseStoryPoints('1,2,3,5,8,13,21,none')).toEqual([
      '1',
      '2',
      '3',
      '5',
      '8',
      '13',
      '21',
      'none',
    ]);
  });
});
