import { describe, it, expect } from 'vitest';

import { filterTree, type TreeFilters } from './filter-tree';

import type { Project } from '$lib/types';

describe('filterTree', () => {
  const mockProjects: Project[] = [
    {
      id: 'proj-1',
      name: 'Active Project',
      status: 'active',
      user_id: 'user-1',
      number: 1,
      description: null,
      created_at: '2024-01-01',
      archived_at: null,
      epics: [
        {
          id: 'epic-1',
          project_id: 'proj-1',
          name: 'Active Epic',
          status: 'active',
          number: 1,
          description: null,
          priority: null,
          is_default: false,
          sort_order: 0,
          issues: [
            {
              id: 'issue-1',
              project_id: 'proj-1',
              epic_id: 'epic-1',
              title: 'P0 Todo Issue',
              status: 'todo',
              priority: 0,
              number: 1,
              parent_issue_id: null,
              milestone_id: null,
              description: null,
              story_points: 1,
              sort_order: 0,
              created_at: '2024-01-01',
            },
            {
              id: 'issue-2',
              project_id: 'proj-1',
              epic_id: 'epic-1',
              title: 'P1 Doing Issue',
              status: 'doing',
              priority: 1,
              number: 2,
              parent_issue_id: null,
              milestone_id: null,
              description: null,
              story_points: 2,
              sort_order: 1,
              created_at: '2024-01-01',
            },
          ],
        },
      ],
    },
    {
      id: 'proj-2',
      name: 'Done Project',
      status: 'done',
      user_id: 'user-1',
      number: 2,
      description: null,
      created_at: '2024-01-01',
      archived_at: null,
      epics: [],
    },
  ];

  it('should return all projects with no filters', () => {
    const filters: TreeFilters = {
      projectStatus: [],
      epicStatus: [],
      issuePriority: [],
      issueStatus: [],
      issueStoryPoints: [],
    };

    const result = filterTree(mockProjects, filters);

    expect(result).toEqual(mockProjects);
  });

  it('should filter projects by status', () => {
    const filters: TreeFilters = {
      projectStatus: ['active'],
      epicStatus: [],
      issuePriority: [],
      issueStatus: [],
      issueStoryPoints: [],
    };

    const result = filterTree(mockProjects, filters);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('proj-1');
  });

  it('should filter epics within projects', () => {
    const filters: TreeFilters = {
      projectStatus: [],
      epicStatus: ['done'],
      issuePriority: [],
      issueStatus: [],
      issueStoryPoints: [],
    };

    const result = filterTree(mockProjects, filters);

    expect(result[0].epics).toHaveLength(0);
  });

  it('should filter issues by priority', () => {
    const filters: TreeFilters = {
      projectStatus: [],
      epicStatus: [],
      issuePriority: [0],
      issueStatus: [],
      issueStoryPoints: [],
    };

    const result = filterTree(mockProjects, filters);

    expect(result[0].epics![0].issues).toHaveLength(1);
    expect(result[0].epics![0].issues![0].priority).toBe(0);
  });

  it('should filter issues by status', () => {
    const filters: TreeFilters = {
      projectStatus: [],
      epicStatus: [],
      issuePriority: [],
      issueStatus: ['todo'],
      issueStoryPoints: [],
    };

    const result = filterTree(mockProjects, filters);

    expect(result[0].epics![0].issues).toHaveLength(1);
    expect(result[0].epics![0].issues![0].status).toBe('todo');
  });

  it('should filter issues by story points', () => {
    const filters: TreeFilters = {
      projectStatus: [],
      epicStatus: [],
      issuePriority: [],
      issueStatus: [],
      issueStoryPoints: [2],
    };

    const result = filterTree(mockProjects, filters);

    expect(result[0].epics![0].issues).toHaveLength(1);
    expect(result[0].epics![0].issues![0].story_points).toBe(2);
  });

  it('should exclude null story points when filter does not include null', () => {
    const projectsWithNullSp: Project[] = [
      {
        ...mockProjects[0],
        epics: [
          {
            ...mockProjects[0].epics![0],
            issues: [
              ...mockProjects[0].epics![0].issues!,
              {
                id: 'issue-3',
                project_id: 'proj-1',
                epic_id: 'epic-1',
                title: 'No SP Issue',
                status: 'todo',
                priority: 2,
                number: 3,
                parent_issue_id: null,
                milestone_id: null,
                description: null,
                story_points: null,
                sort_order: 2,
                created_at: '2024-01-01',
              },
            ],
          },
        ],
      },
    ];

    const filters: TreeFilters = {
      projectStatus: [],
      epicStatus: [],
      issuePriority: [],
      issueStatus: [],
      issueStoryPoints: [1, 2],
    };

    const result = filterTree(projectsWithNullSp, filters);

    expect(result[0].epics![0].issues).toHaveLength(2);
    expect(result[0].epics![0].issues!.every((i) => i.story_points !== null)).toBe(true);
  });

  it('should include null story points when filter includes null', () => {
    const projectsWithNullSp: Project[] = [
      {
        ...mockProjects[0],
        epics: [
          {
            ...mockProjects[0].epics![0],
            issues: [
              ...mockProjects[0].epics![0].issues!,
              {
                id: 'issue-3',
                project_id: 'proj-1',
                epic_id: 'epic-1',
                title: 'No SP Issue',
                status: 'todo',
                priority: 2,
                number: 3,
                parent_issue_id: null,
                milestone_id: null,
                description: null,
                story_points: null,
                sort_order: 2,
                created_at: '2024-01-01',
              },
            ],
          },
        ],
      },
    ];

    const filters: TreeFilters = {
      projectStatus: [],
      epicStatus: [],
      issuePriority: [],
      issueStatus: [],
      issueStoryPoints: [1, null],
    };

    const result = filterTree(projectsWithNullSp, filters);

    expect(result[0].epics![0].issues).toHaveLength(2);
    const ids = result[0].epics![0].issues!.map((i) => i.id);
    expect(ids).toContain('issue-1');
    expect(ids).toContain('issue-3');
  });

  it('should apply cascading filters (project + epic + issue)', () => {
    const filters: TreeFilters = {
      projectStatus: ['active'],
      epicStatus: ['active'],
      issuePriority: [0],
      issueStatus: [],
      issueStoryPoints: [],
    };

    const result = filterTree(mockProjects, filters);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('proj-1');
    expect(result[0].epics).toHaveLength(1);
    expect(result[0].epics![0].issues).toHaveLength(1);
    expect(result[0].epics![0].issues![0].priority).toBe(0);
  });
});
