// src/lib/utils/tree-filter-params.test.ts
import { describe, it, expect } from 'vitest';

import {
  parseTreeFilterParams,
  buildTreeFilterUrl,
  type TreeFilterParams,
} from './tree-filter-params';

describe('parseTreeFilterParams', () => {
  it('should parse empty params to default state', () => {
    const params = new URLSearchParams('');
    const result = parseTreeFilterParams(params);

    expect(result).toEqual({
      projectStatus: [],
      epicStatus: [],
      issuePriority: [],
      issueStatus: [],
      issueStoryPoints: [],
      groupBy: 'none',
      sortBy: 'priority',
      sortDir: 'asc',
    });
  });

  it('should parse project status filter', () => {
    const params = new URLSearchParams('project_status=active,done');
    const result = parseTreeFilterParams(params);

    expect(result.projectStatus).toEqual(['active', 'done']);
  });

  it('should parse epic status filter', () => {
    const params = new URLSearchParams('epic_status=active');
    const result = parseTreeFilterParams(params);

    expect(result.epicStatus).toEqual(['active']);
  });

  it('should parse issue filters', () => {
    const params = new URLSearchParams('priority=0,1&status=todo,doing&story_points=1,2,3');
    const result = parseTreeFilterParams(params);

    expect(result.issuePriority).toEqual([0, 1]);
    expect(result.issueStatus).toEqual(['todo', 'doing']);
    expect(result.issueStoryPoints).toEqual([1, 2, 3]);
  });

  it('should parse grouping and sorting', () => {
    const params = new URLSearchParams('group_by=priority&sort_by=status&sort_dir=desc');
    const result = parseTreeFilterParams(params);

    expect(result.groupBy).toBe('priority');
    expect(result.sortBy).toBe('status');
    expect(result.sortDir).toBe('desc');
  });

  it('should handle story_points with "none" value', () => {
    const params = new URLSearchParams('story_points=1,2,none');
    const result = parseTreeFilterParams(params);

    expect(result.issueStoryPoints).toEqual([1, 2, null]);
  });

  it('should ignore invalid values', () => {
    const params = new URLSearchParams('priority=99&status=invalid&group_by=invalid');
    const result = parseTreeFilterParams(params);

    expect(result.issuePriority).toEqual([]);
    expect(result.issueStatus).toEqual([]);
    expect(result.groupBy).toBe('none');
  });
});

describe('buildTreeFilterUrl', () => {
  it('should build URL with filters', () => {
    const filters: TreeFilterParams = {
      projectStatus: ['active'],
      epicStatus: ['active', 'done'],
      issuePriority: [0, 1],
      issueStatus: ['todo'],
      issueStoryPoints: [1, 2, null],
      groupBy: 'priority',
      sortBy: 'status',
      sortDir: 'desc',
    };

    const url = buildTreeFilterUrl(filters, '/projects');

    expect(url).toBe(
      '/projects?project_status=active&epic_status=active,done&priority=0,1&status=todo&story_points=1,2,none&group_by=priority&sort_by=status&sort_dir=desc',
    );
  });

  it('should omit empty filters', () => {
    const filters: TreeFilterParams = {
      projectStatus: [],
      epicStatus: [],
      issuePriority: [],
      issueStatus: [],
      issueStoryPoints: [],
      groupBy: 'none',
      sortBy: 'priority',
      sortDir: 'asc',
    };

    const url = buildTreeFilterUrl(filters, '/projects');

    expect(url).toBe('/projects');
  });
});
