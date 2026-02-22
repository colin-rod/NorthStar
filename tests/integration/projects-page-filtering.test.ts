// tests/integration/projects-page-filtering.test.ts
/**
 * Integration test for Projects Page Filtering (Phase 1: Foundation)
 *
 * Tests the complete integration of:
 * 1. URL parameter parsing (parseTreeFilterParams)
 * 2. Tree filtering with real project data structure (filterTree)
 * 3. FilterPanel component rendering and URL updates
 * 4. All filter components working together
 */

import { render, screen } from '@testing-library/svelte';
import { writable } from 'svelte/store';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import FilterPanel from '$lib/components/FilterPanel.svelte';
import type { Project } from '$lib/types';
import { filterTree } from '$lib/utils/filter-tree';
import { parseTreeFilterParams, buildTreeFilterUrl } from '$lib/utils/tree-filter-params';

// Mock navigation modules
vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
}));

let mockPageStore: ReturnType<typeof writable>;

vi.mock('$app/stores', () => ({
  get page() {
    return mockPageStore;
  },
}));

describe('Projects Page Filtering - Phase 1 Integration', () => {
  // Test data representing full project hierarchy
  const testProjects: Project[] = [
    {
      id: 'proj-1',
      user_id: 'user-1',
      number: 1,
      name: 'Active Project with Mixed Issues',
      description: null,
      status: 'active',
      created_at: '2024-01-01T00:00:00Z',
      archived_at: null,
      epics: [
        {
          id: 'epic-1',
          project_id: 'proj-1',
          number: 1,
          name: 'Active Epic',
          description: null,
          status: 'active',
          priority: 0,
          is_default: false,
          sort_order: 0,
          milestone_id: null,
          issues: [
            {
              id: 'issue-1',
              project_id: 'proj-1',
              epic_id: 'epic-1',
              number: 1,
              parent_issue_id: null,
              milestone_id: null,
              title: 'P0 Todo Issue with 5 points',
              description: null,
              status: 'todo',
              priority: 0,
              story_points: 5,
              sort_order: 0,
              created_at: '2024-01-01T00:00:00Z',
            },
            {
              id: 'issue-2',
              project_id: 'proj-1',
              epic_id: 'epic-1',
              number: 2,
              parent_issue_id: null,
              milestone_id: null,
              title: 'P1 Doing Issue with 3 points',
              description: null,
              status: 'doing',
              priority: 1,
              story_points: 3,
              sort_order: 1,
              created_at: '2024-01-01T00:00:00Z',
            },
            {
              id: 'issue-3',
              project_id: 'proj-1',
              epic_id: 'epic-1',
              number: 3,
              parent_issue_id: null,
              milestone_id: null,
              title: 'P2 In Review Issue with no points',
              description: null,
              status: 'in_review',
              priority: 2,
              story_points: null,
              sort_order: 2,
              created_at: '2024-01-01T00:00:00Z',
            },
          ],
        },
        {
          id: 'epic-2',
          project_id: 'proj-1',
          number: 2,
          name: 'Done Epic',
          description: null,
          status: 'done',
          priority: 1,
          is_default: false,
          sort_order: 1,
          milestone_id: null,
          issues: [
            {
              id: 'issue-4',
              project_id: 'proj-1',
              epic_id: 'epic-2',
              number: 4,
              parent_issue_id: null,
              milestone_id: null,
              title: 'P3 Done Issue',
              description: null,
              status: 'done',
              priority: 3,
              story_points: 1,
              sort_order: 0,
              created_at: '2024-01-01T00:00:00Z',
            },
          ],
        },
      ],
    },
    {
      id: 'proj-2',
      user_id: 'user-1',
      number: 2,
      name: 'Done Project',
      description: null,
      status: 'done',
      created_at: '2024-01-02T00:00:00Z',
      archived_at: null,
      epics: [
        {
          id: 'epic-3',
          project_id: 'proj-2',
          number: 3,
          name: 'Canceled Epic',
          description: null,
          status: 'canceled',
          priority: null,
          is_default: false,
          sort_order: 0,
          milestone_id: null,
          issues: [],
        },
      ],
    },
    {
      id: 'proj-3',
      user_id: 'user-1',
      number: 3,
      name: 'Canceled Project',
      description: null,
      status: 'canceled',
      created_at: '2024-01-03T00:00:00Z',
      archived_at: null,
      epics: [],
    },
  ];

  beforeEach(() => {
    // Reset mock page store before each test
    mockPageStore = writable({
      url: new URL('http://localhost:5173/projects'),
    });
  });

  describe('URL Parameter Parsing', () => {
    it('should correctly parse empty URL params to default state', () => {
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

    it('should correctly parse all filter types from URL', () => {
      const params = new URLSearchParams(
        'project_status=active,done&epic_status=active&priority=0,1&status=todo,doing&story_points=3,5,none',
      );
      const result = parseTreeFilterParams(params);

      expect(result.projectStatus).toEqual(['active', 'done']);
      expect(result.epicStatus).toEqual(['active']);
      expect(result.issuePriority).toEqual([0, 1]);
      expect(result.issueStatus).toEqual(['todo', 'doing']);
      expect(result.issueStoryPoints).toEqual([3, 5, null]);
    });

    it('should correctly parse grouping and sorting params', () => {
      const params = new URLSearchParams('group_by=priority&sort_by=status&sort_dir=desc');
      const result = parseTreeFilterParams(params);

      expect(result.groupBy).toBe('priority');
      expect(result.sortBy).toBe('status');
      expect(result.sortDir).toBe('desc');
    });

    it('should ignore invalid parameter values', () => {
      const params = new URLSearchParams(
        'project_status=invalid&priority=99&status=bad&story_points=999',
      );
      const result = parseTreeFilterParams(params);

      expect(result.projectStatus).toEqual([]);
      expect(result.issuePriority).toEqual([]);
      expect(result.issueStatus).toEqual([]);
      expect(result.issueStoryPoints).toEqual([]);
    });

    it('should handle malformed parameters gracefully', () => {
      const params = new URLSearchParams('priority=abc,def&story_points=xyz');
      const result = parseTreeFilterParams(params);

      expect(result.issuePriority).toEqual([]);
      expect(result.issueStoryPoints).toEqual([]);
    });
  });

  describe('URL Building', () => {
    it('should build correct URL with all filter types', () => {
      const filters = {
        projectStatus: ['active', 'done'] as const,
        epicStatus: ['active'] as const,
        issuePriority: [0, 1],
        issueStatus: ['todo', 'doing'] as const,
        issueStoryPoints: [3, 5, null] as (number | null)[],
        groupBy: 'priority' as const,
        sortBy: 'status' as const,
        sortDir: 'desc' as const,
      };

      const url = buildTreeFilterUrl(filters, '/projects');

      expect(url).toBe(
        '/projects?project_status=active,done&epic_status=active&priority=0,1&status=todo,doing&story_points=3,5,none&group_by=priority&sort_by=status&sort_dir=desc',
      );
    });

    it('should omit default values from URL', () => {
      const filters = {
        projectStatus: [],
        epicStatus: [],
        issuePriority: [],
        issueStatus: [],
        issueStoryPoints: [],
        groupBy: 'none' as const,
        sortBy: 'priority' as const,
        sortDir: 'asc' as const,
      };

      const url = buildTreeFilterUrl(filters, '/projects');

      expect(url).toBe('/projects');
    });

    it('should handle null story points correctly in URL', () => {
      const filters = {
        projectStatus: [],
        epicStatus: [],
        issuePriority: [],
        issueStatus: [],
        issueStoryPoints: [1, null, 5] as (number | null)[],
        groupBy: 'none' as const,
        sortBy: 'priority' as const,
        sortDir: 'asc' as const,
      };

      const url = buildTreeFilterUrl(filters, '/projects');

      expect(url).toBe('/projects?story_points=1,none,5');
    });
  });

  describe('Tree Filtering with Real Project Structure', () => {
    it('should not filter when no filters are applied', () => {
      const filters = {
        projectStatus: [],
        epicStatus: [],
        issuePriority: [],
        issueStatus: [],
        issueStoryPoints: [],
      };

      const result = filterTree(testProjects, filters);

      expect(result).toHaveLength(3);
      expect(result[0].epics).toHaveLength(2);
      expect(result[0].epics![0].issues).toHaveLength(3);
    });

    it('should filter projects by status', () => {
      const filters = {
        projectStatus: ['active'],
        epicStatus: [],
        issuePriority: [],
        issueStatus: [],
        issueStoryPoints: [],
      };

      const result = filterTree(testProjects, filters);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('proj-1');
      expect(result[0].status).toBe('active');
    });

    it('should filter epics while preserving parent projects', () => {
      const filters = {
        projectStatus: [],
        epicStatus: ['active'],
        issuePriority: [],
        issueStatus: [],
        issueStoryPoints: [],
      };

      const result = filterTree(testProjects, filters);

      // Projects should still be present, but epics filtered
      expect(result).toHaveLength(3);
      expect(result[0].epics).toHaveLength(1);
      expect(result[0].epics![0].status).toBe('active');
      expect(result[1].epics).toHaveLength(0); // Epic was filtered out
    });

    it('should filter issues by priority', () => {
      const filters = {
        projectStatus: [],
        epicStatus: [],
        issuePriority: [0, 1],
        issueStatus: [],
        issueStoryPoints: [],
      };

      const result = filterTree(testProjects, filters);

      const activeEpic = result[0].epics![0];
      expect(activeEpic.issues).toHaveLength(2);
      expect(activeEpic.issues!.every((i) => [0, 1].includes(i.priority))).toBe(true);
    });

    it('should filter issues by status', () => {
      const filters = {
        projectStatus: [],
        epicStatus: [],
        issuePriority: [],
        issueStatus: ['todo', 'doing'],
        issueStoryPoints: [],
      };

      const result = filterTree(testProjects, filters);

      const activeEpic = result[0].epics![0];
      expect(activeEpic.issues).toHaveLength(2);
      expect(activeEpic.issues!.every((i) => ['todo', 'doing'].includes(i.status))).toBe(true);
    });

    it('should filter issues by story points including null', () => {
      const filters = {
        projectStatus: [],
        epicStatus: [],
        issuePriority: [],
        issueStatus: [],
        issueStoryPoints: [5, null],
      };

      const result = filterTree(testProjects, filters);

      const activeEpic = result[0].epics![0];
      expect(activeEpic.issues).toHaveLength(2);
      expect(activeEpic.issues!.every((i) => i.story_points === 5 || i.story_points === null)).toBe(
        true,
      );
    });

    it('should apply cascading filters across all levels', () => {
      const filters = {
        projectStatus: ['active'],
        epicStatus: ['active'],
        issuePriority: [0, 1],
        issueStatus: ['todo'],
        issueStoryPoints: [5],
      };

      const result = filterTree(testProjects, filters);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('proj-1');
      expect(result[0].epics).toHaveLength(1);
      expect(result[0].epics![0].id).toBe('epic-1');
      expect(result[0].epics![0].issues).toHaveLength(1);

      const filteredIssue = result[0].epics![0].issues![0];
      expect(filteredIssue.status).toBe('todo');
      expect(filteredIssue.priority).toBe(0);
      expect(filteredIssue.story_points).toBe(5);
    });

    it('should handle empty results gracefully', () => {
      const filters = {
        projectStatus: ['active'],
        epicStatus: ['active'],
        issuePriority: [0],
        issueStatus: ['done'], // No done issues in active epics
        issueStoryPoints: [],
      };

      const result = filterTree(testProjects, filters);

      expect(result).toHaveLength(1);
      expect(result[0].epics).toHaveLength(1);
      expect(result[0].epics![0].issues).toHaveLength(0);
    });
  });

  describe('FilterPanel Component Integration', () => {
    it('should render with correct filter params', () => {
      const filterParams = {
        projectStatus: ['active'] as const,
        epicStatus: ['active'] as const,
        issuePriority: [0, 1],
        issueStatus: ['todo'] as const,
        issueStoryPoints: [5] as (number | null)[],
        groupBy: 'none' as const,
        sortBy: 'priority' as const,
        sortDir: 'asc' as const,
      };

      render(FilterPanel, {
        props: {
          filterParams,
          open: true,
        },
      });

      expect(screen.getByText('Project Filters')).toBeInTheDocument();
      expect(screen.getByText('Epic Filters')).toBeInTheDocument();
      expect(screen.getByText('Issue Filters')).toBeInTheDocument();
      expect(screen.getByText('Clear all filters')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      const filterParams = {
        projectStatus: [],
        epicStatus: [],
        issuePriority: [],
        issueStatus: [],
        issueStoryPoints: [],
        groupBy: 'none' as const,
        sortBy: 'priority' as const,
        sortDir: 'asc' as const,
      };

      render(FilterPanel, {
        props: {
          filterParams,
          open: false,
        },
      });

      expect(screen.queryByText('Project Filters')).not.toBeInTheDocument();
    });

    it('should handle all empty filters', () => {
      const filterParams = {
        projectStatus: [],
        epicStatus: [],
        issuePriority: [],
        issueStatus: [],
        issueStoryPoints: [],
        groupBy: 'none' as const,
        sortBy: 'priority' as const,
        sortDir: 'asc' as const,
      };

      render(FilterPanel, {
        props: {
          filterParams,
          open: true,
        },
      });

      expect(screen.getByText('Clear all filters')).toBeInTheDocument();
    });
  });

  describe('End-to-End Filter Flow', () => {
    it('should parse URL params, filter data, and display correctly', () => {
      // 1. Parse URL params
      const params = new URLSearchParams('project_status=active&priority=0&status=todo');
      const filterParams = parseTreeFilterParams(params);

      // 2. Apply filters to data
      const filteredProjects = filterTree(testProjects, {
        projectStatus: filterParams.projectStatus,
        epicStatus: filterParams.epicStatus,
        issuePriority: filterParams.issuePriority,
        issueStatus: filterParams.issueStatus,
        issueStoryPoints: filterParams.issueStoryPoints,
      });

      // 3. Verify filtering results
      expect(filteredProjects).toHaveLength(1);
      expect(filteredProjects[0].status).toBe('active');

      const activeEpic = filteredProjects[0].epics![0];
      expect(activeEpic.issues).toHaveLength(1);
      expect(activeEpic.issues![0].priority).toBe(0);
      expect(activeEpic.issues![0].status).toBe('todo');

      // 4. Render FilterPanel with parsed params
      render(FilterPanel, {
        props: {
          filterParams,
          open: true,
        },
      });

      expect(screen.getByText('Project Filters')).toBeInTheDocument();
      expect(screen.getByText('Epic Filters')).toBeInTheDocument();
      expect(screen.getByText('Issue Filters')).toBeInTheDocument();
    });

    it('should round-trip URL params through parse and build', () => {
      const originalUrl =
        'project_status=active,done&epic_status=active&priority=0,1&status=todo&story_points=5,none';
      const params = new URLSearchParams(originalUrl);

      // Parse
      const filterParams = parseTreeFilterParams(params);

      // Build
      const rebuiltUrl = buildTreeFilterUrl(filterParams, '/projects');

      // Should match original (query string part)
      expect(rebuiltUrl).toBe(`/projects?${originalUrl}`);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle projects with no epics', () => {
      const filters = {
        projectStatus: ['canceled'],
        epicStatus: [],
        issuePriority: [],
        issueStatus: [],
        issueStoryPoints: [],
      };

      const result = filterTree(testProjects, filters);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('proj-3');
      expect(result[0].epics).toHaveLength(0);
    });

    it('should handle epics with no issues', () => {
      const filters = {
        projectStatus: ['done'],
        epicStatus: ['canceled'],
        issuePriority: [],
        issueStatus: [],
        issueStoryPoints: [],
      };

      const result = filterTree(testProjects, filters);

      expect(result).toHaveLength(1);
      expect(result[0].epics).toHaveLength(1);
      expect(result[0].epics![0].issues).toHaveLength(0);
    });

    it('should handle multiple story point values including null', () => {
      const filters = {
        projectStatus: [],
        epicStatus: [],
        issuePriority: [],
        issueStatus: [],
        issueStoryPoints: [1, 3, 5, null],
      };

      const result = filterTree(testProjects, filters);

      const allIssues = result[0].epics!.flatMap((e) => e.issues || []);
      expect(allIssues.length).toBeGreaterThan(0);
      expect(
        allIssues.every((i) => [1, 3, 5, null].includes(i.story_points as number | null)),
      ).toBe(true);
    });

    it('should handle all project statuses', () => {
      const statuses: ('active' | 'done' | 'canceled')[] = ['active', 'done', 'canceled'];

      statuses.forEach((status) => {
        const filters = {
          projectStatus: [status],
          epicStatus: [],
          issuePriority: [],
          issueStatus: [],
          issueStoryPoints: [],
        };

        const result = filterTree(testProjects, filters);
        expect(result.length).toBeGreaterThan(0);
        expect(result.every((p) => p.status === status)).toBe(true);
      });
    });

    it('should handle all issue priorities (P0-P3)', () => {
      const priorities = [0, 1, 2, 3];

      priorities.forEach((priority) => {
        const filters = {
          projectStatus: [],
          epicStatus: [],
          issuePriority: [priority],
          issueStatus: [],
          issueStoryPoints: [],
        };

        const result = filterTree(testProjects, filters);
        const allIssues = result.flatMap((p) => p.epics?.flatMap((e) => e.issues || []) || []);

        if (allIssues.length > 0) {
          expect(allIssues.every((i) => i.priority === priority)).toBe(true);
        }
      });
    });
  });
});
