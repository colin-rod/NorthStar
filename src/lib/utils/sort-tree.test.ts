/**
 * Sort Tree Tests
 *
 * Test suite for context-aware tree sorting functionality.
 * Sorting applies at all three levels: Projects, Epics, and Issues.
 */

import { describe, it, expect } from 'vitest';

import { sortTree } from './sort-tree';

import type { Project, Epic, Issue, StoryPoints } from '$lib/types';

// Test fixtures
const createProject = (
  id: string,
  name: string,
  status: 'active' | 'done' | 'canceled' = 'active',
): Project => ({
  id,
  user_id: 'user-1',
  number: parseInt(id, 36),
  name,
  description: null,
  created_at: '2024-01-01T00:00:00Z',
  archived_at: null,
  status,
  epics: [],
});

const createEpic = (
  id: string,
  project_id: string,
  name: string,
  status: 'active' | 'done' | 'canceled' = 'active',
): Epic => ({
  id,
  project_id,
  number: parseInt(id, 36),
  name,
  description: null,
  status,
  priority: null,
  is_default: false,
  sort_order: null,
  issues: [],
});

const createIssue = (
  id: string,
  epic_id: string,
  project_id: string,
  title: string,
  priority: number = 1,
  status: 'todo' | 'doing' | 'in_review' | 'done' | 'canceled' = 'todo',
  story_points: StoryPoints | null = null,
): Issue => ({
  id,
  project_id,
  epic_id,
  number: parseInt(id, 36),
  milestone_id: null,
  title,
  description: null,
  status,
  priority,
  story_points,
  sort_order: null,
  created_at: '2024-01-01T00:00:00Z',
});

describe('sortTree - Priority Sorting', () => {
  it('should sort projects by highest priority issue (P0 first)', () => {
    const projectA = createProject('A', 'Project A');
    const projectB = createProject('B', 'Project B');
    const projectC = createProject('C', 'Project C');

    const epicA1 = createEpic('A1', 'A', 'Epic A1');
    const epicB1 = createEpic('B1', 'B', 'Epic B1');
    const epicC1 = createEpic('C1', 'C', 'Epic C1');

    // Project A has P2 issue
    epicA1.issues = [createIssue('A1-1', 'A1', 'A', 'Issue A1-1', 2)];
    projectA.epics = [epicA1];

    // Project B has P0 issue
    epicB1.issues = [createIssue('B1-1', 'B1', 'B', 'Issue B1-1', 0)];
    projectB.epics = [epicB1];

    // Project C has P1 issue
    epicC1.issues = [createIssue('C1-1', 'C1', 'C', 'Issue C1-1', 1)];
    projectC.epics = [epicC1];

    const projects = [projectA, projectB, projectC];
    const sorted = sortTree(projects, 'priority', 'asc');

    expect(sorted.map((p) => p.id)).toEqual(['B', 'C', 'A']); // P0, P1, P2
  });

  it('should sort epics by highest priority issue', () => {
    const project = createProject('A', 'Project A');
    const epic1 = createEpic('E1', 'A', 'Epic 1');
    const epic2 = createEpic('E2', 'A', 'Epic 2');
    const epic3 = createEpic('E3', 'A', 'Epic 3');

    // Epic 1 has P2 issue
    epic1.issues = [createIssue('I1', 'E1', 'A', 'Issue 1', 2)];

    // Epic 2 has P0 issue
    epic2.issues = [createIssue('I2', 'E2', 'A', 'Issue 2', 0)];

    // Epic 3 has P1 issue
    epic3.issues = [createIssue('I3', 'E3', 'A', 'Issue 3', 1)];

    project.epics = [epic1, epic2, epic3];

    const sorted = sortTree([project], 'priority', 'asc');
    expect(sorted[0].epics?.map((e) => e.id)).toEqual(['E2', 'E3', 'E1']); // P0, P1, P2
  });

  it('should sort issues by priority (P0 > P1 > P2 > P3)', () => {
    const project = createProject('A', 'Project A');
    const epic = createEpic('E1', 'A', 'Epic 1');

    epic.issues = [
      createIssue('I3', 'E1', 'A', 'Issue P3', 3),
      createIssue('I0', 'E1', 'A', 'Issue P0', 0),
      createIssue('I2', 'E1', 'A', 'Issue P2', 2),
      createIssue('I1', 'E1', 'A', 'Issue P1', 1),
    ];

    project.epics = [epic];

    const sorted = sortTree([project], 'priority', 'asc');
    expect(sorted[0].epics?.[0].issues?.map((i) => i.id)).toEqual(['I0', 'I1', 'I2', 'I3']);
  });

  it('should handle descending priority sort', () => {
    const project = createProject('A', 'Project A');
    const epic = createEpic('E1', 'A', 'Epic 1');

    epic.issues = [
      createIssue('I0', 'E1', 'A', 'Issue P0', 0),
      createIssue('I1', 'E1', 'A', 'Issue P1', 1),
      createIssue('I2', 'E1', 'A', 'Issue P2', 2),
      createIssue('I3', 'E1', 'A', 'Issue P3', 3),
    ];

    project.epics = [epic];

    const sorted = sortTree([project], 'priority', 'desc');
    expect(sorted[0].epics?.[0].issues?.map((i) => i.id)).toEqual(['I3', 'I2', 'I1', 'I0']);
  });
});

describe('sortTree - Status Sorting', () => {
  it('should sort issues by status with custom order', () => {
    const project = createProject('A', 'Project A');
    const epic = createEpic('E1', 'A', 'Epic 1');

    epic.issues = [
      createIssue('I1', 'E1', 'A', 'Done Issue', 1, 'done'),
      createIssue('I2', 'E1', 'A', 'Todo Issue', 1, 'todo'),
      createIssue('I3', 'E1', 'A', 'Doing Issue', 1, 'doing'),
      createIssue('I4', 'E1', 'A', 'In Review Issue', 1, 'in_review'),
      createIssue('I5', 'E1', 'A', 'Canceled Issue', 1, 'canceled'),
    ];

    project.epics = [epic];

    const sorted = sortTree([project], 'status', 'asc');
    // Expected order: todo > doing > in_review > done > canceled
    expect(sorted[0].epics?.[0].issues?.map((i) => i.status)).toEqual([
      'todo',
      'doing',
      'in_review',
      'done',
      'canceled',
    ]);
  });

  it('should sort projects by status using custom order', () => {
    const projectA = createProject('A', 'Project A', 'done');
    const projectB = createProject('B', 'Project B', 'active');
    const projectC = createProject('C', 'Project C', 'canceled');

    const projects = [projectA, projectB, projectC];
    const sorted = sortTree(projects, 'status', 'asc');

    // Expected order: active > done > canceled
    expect(sorted.map((p) => p.status)).toEqual(['active', 'done', 'canceled']);
  });

  it('should sort epics by status using custom order', () => {
    const project = createProject('A', 'Project A');
    const epic1 = createEpic('E1', 'A', 'Epic 1', 'done');
    const epic2 = createEpic('E2', 'A', 'Epic 2', 'active');
    const epic3 = createEpic('E3', 'A', 'Epic 3', 'canceled');

    project.epics = [epic1, epic2, epic3];

    const sorted = sortTree([project], 'status', 'asc');
    expect(sorted[0].epics?.map((e) => e.status)).toEqual(['active', 'done', 'canceled']);
  });
});

describe('sortTree - Name/Title Sorting', () => {
  it('should sort projects alphabetically by name', () => {
    const projectC = createProject('C', 'Charlie');
    const projectA = createProject('A', 'Alpha');
    const projectB = createProject('B', 'Bravo');

    const projects = [projectC, projectA, projectB];
    const sorted = sortTree(projects, 'title', 'asc');

    expect(sorted.map((p) => p.name)).toEqual(['Alpha', 'Bravo', 'Charlie']);
  });

  it('should sort epics alphabetically by name', () => {
    const project = createProject('A', 'Project A');
    const epic1 = createEpic('E1', 'A', 'Zebra');
    const epic2 = createEpic('E2', 'A', 'Alpha');
    const epic3 = createEpic('E3', 'A', 'Mike');

    project.epics = [epic1, epic2, epic3];

    const sorted = sortTree([project], 'title', 'asc');
    expect(sorted[0].epics?.map((e) => e.name)).toEqual(['Alpha', 'Mike', 'Zebra']);
  });

  it('should sort issues alphabetically by title', () => {
    const project = createProject('A', 'Project A');
    const epic = createEpic('E1', 'A', 'Epic 1');

    epic.issues = [
      createIssue('I1', 'E1', 'A', 'Zebra task'),
      createIssue('I2', 'E1', 'A', 'Alpha task'),
      createIssue('I3', 'E1', 'A', 'Mike task'),
    ];

    project.epics = [epic];

    const sorted = sortTree([project], 'title', 'asc');
    expect(sorted[0].epics?.[0].issues?.map((i) => i.title)).toEqual([
      'Alpha task',
      'Mike task',
      'Zebra task',
    ]);
  });

  it('should handle case-insensitive alphabetical sorting', () => {
    const project = createProject('A', 'Project A');
    const epic = createEpic('E1', 'A', 'Epic 1');

    epic.issues = [
      createIssue('I1', 'E1', 'A', 'zebra'),
      createIssue('I2', 'E1', 'A', 'ALPHA'),
      createIssue('I3', 'E1', 'A', 'Mike'),
    ];

    project.epics = [epic];

    const sorted = sortTree([project], 'title', 'asc');
    expect(sorted[0].epics?.[0].issues?.map((i) => i.title)).toEqual(['ALPHA', 'Mike', 'zebra']);
  });

  it('should sort descending alphabetically', () => {
    const project = createProject('A', 'Project A');
    const epic = createEpic('E1', 'A', 'Epic 1');

    epic.issues = [
      createIssue('I1', 'E1', 'A', 'Alpha'),
      createIssue('I2', 'E1', 'A', 'Bravo'),
      createIssue('I3', 'E1', 'A', 'Charlie'),
    ];

    project.epics = [epic];

    const sorted = sortTree([project], 'title', 'desc');
    expect(sorted[0].epics?.[0].issues?.map((i) => i.title)).toEqual(['Charlie', 'Bravo', 'Alpha']);
  });
});

describe('sortTree - Story Points Sorting', () => {
  it('should sort issues by story points', () => {
    const project = createProject('A', 'Project A');
    const epic = createEpic('E1', 'A', 'Epic 1');

    epic.issues = [
      createIssue('I1', 'E1', 'A', 'Issue 1', 1, 'todo', 8),
      createIssue('I2', 'E1', 'A', 'Issue 2', 1, 'todo', 2),
      createIssue('I3', 'E1', 'A', 'Issue 3', 1, 'todo', 13),
      createIssue('I4', 'E1', 'A', 'Issue 4', 1, 'todo', 5),
    ];

    project.epics = [epic];

    const sorted = sortTree([project], 'story_points', 'asc');
    expect(sorted[0].epics?.[0].issues?.map((i) => i.story_points)).toEqual([2, 5, 8, 13]);
  });

  it('should handle null story points (sort them last in asc)', () => {
    const project = createProject('A', 'Project A');
    const epic = createEpic('E1', 'A', 'Epic 1');

    epic.issues = [
      createIssue('I1', 'E1', 'A', 'Issue 1', 1, 'todo', 8),
      createIssue('I2', 'E1', 'A', 'Issue 2', 1, 'todo', null),
      createIssue('I3', 'E1', 'A', 'Issue 3', 1, 'todo', 3),
      createIssue('I4', 'E1', 'A', 'Issue 4', 1, 'todo', null),
    ];

    project.epics = [epic];

    const sorted = sortTree([project], 'story_points', 'asc');
    expect(sorted[0].epics?.[0].issues?.map((i) => i.story_points)).toEqual([3, 8, null, null]);
  });

  it('should handle null story points (sort them first in desc)', () => {
    const project = createProject('A', 'Project A');
    const epic = createEpic('E1', 'A', 'Epic 1');

    epic.issues = [
      createIssue('I1', 'E1', 'A', 'Issue 1', 1, 'todo', 8),
      createIssue('I2', 'E1', 'A', 'Issue 2', 1, 'todo', null),
      createIssue('I3', 'E1', 'A', 'Issue 3', 1, 'todo', 3),
    ];

    project.epics = [epic];

    const sorted = sortTree([project], 'story_points', 'desc');
    expect(sorted[0].epics?.[0].issues?.map((i) => i.story_points)).toEqual([null, 8, 3]);
  });

  it('should sort projects by total story points', () => {
    const projectA = createProject('A', 'Project A');
    const projectB = createProject('B', 'Project B');
    const projectC = createProject('C', 'Project C');

    const epicA1 = createEpic('A1', 'A', 'Epic A1');
    const epicB1 = createEpic('B1', 'B', 'Epic B1');
    const epicC1 = createEpic('C1', 'C', 'Epic C1');

    // Project A: total 10 points
    epicA1.issues = [
      createIssue('A1-1', 'A1', 'A', 'Issue 1', 1, 'todo', 5),
      createIssue('A1-2', 'A1', 'A', 'Issue 2', 1, 'todo', 5),
    ];
    projectA.epics = [epicA1];

    // Project B: total 21 points
    epicB1.issues = [
      createIssue('B1-1', 'B1', 'B', 'Issue 1', 1, 'todo', 8),
      createIssue('B1-2', 'B1', 'B', 'Issue 2', 1, 'todo', 13),
    ];
    projectB.epics = [epicB1];

    // Project C: total 3 points
    epicC1.issues = [createIssue('C1-1', 'C1', 'C', 'Issue 1', 1, 'todo', 3)];
    projectC.epics = [epicC1];

    const projects = [projectA, projectB, projectC];
    const sorted = sortTree(projects, 'story_points', 'asc');

    expect(sorted.map((p) => p.id)).toEqual(['C', 'A', 'B']); // 3, 10, 21
  });

  it('should sort epics by total story points', () => {
    const project = createProject('A', 'Project A');
    const epic1 = createEpic('E1', 'A', 'Epic 1');
    const epic2 = createEpic('E2', 'A', 'Epic 2');
    const epic3 = createEpic('E3', 'A', 'Epic 3');

    // Epic 1: 8 points
    epic1.issues = [createIssue('I1', 'E1', 'A', 'Issue 1', 1, 'todo', 8)];

    // Epic 2: 13 points
    epic2.issues = [createIssue('I2', 'E2', 'A', 'Issue 2', 1, 'todo', 13)];

    // Epic 3: 3 points
    epic3.issues = [createIssue('I3', 'E3', 'A', 'Issue 3', 1, 'todo', 3)];

    project.epics = [epic1, epic2, epic3];

    const sorted = sortTree([project], 'story_points', 'asc');
    expect(sorted[0].epics?.map((e) => e.id)).toEqual(['E3', 'E1', 'E2']); // 3, 8, 13
  });
});

describe('sortTree - Progress Sorting', () => {
  it('should sort projects by completion percentage', () => {
    const projectA = createProject('A', 'Project A');
    const projectB = createProject('B', 'Project B');
    const projectC = createProject('C', 'Project C');

    const epicA1 = createEpic('A1', 'A', 'Epic A1');
    const epicB1 = createEpic('B1', 'B', 'Epic B1');
    const epicC1 = createEpic('C1', 'C', 'Epic C1');

    // Project A: 50% (5 done, 5 todo = 10 total)
    epicA1.issues = [
      createIssue('A1-1', 'A1', 'A', 'Issue 1', 1, 'done', 5),
      createIssue('A1-2', 'A1', 'A', 'Issue 2', 1, 'todo', 5),
    ];
    projectA.epics = [epicA1];

    // Project B: 100% (all done)
    epicB1.issues = [createIssue('B1-1', 'B1', 'B', 'Issue 1', 1, 'done', 8)];
    projectB.epics = [epicB1];

    // Project C: 0% (all todo)
    epicC1.issues = [createIssue('C1-1', 'C1', 'C', 'Issue 1', 1, 'todo', 3)];
    projectC.epics = [epicC1];

    const projects = [projectA, projectB, projectC];
    const sorted = sortTree(projects, 'progress', 'asc');

    expect(sorted.map((p) => p.id)).toEqual(['C', 'A', 'B']); // 0%, 50%, 100%
  });

  it('should sort epics by completion percentage', () => {
    const project = createProject('A', 'Project A');
    const epic1 = createEpic('E1', 'A', 'Epic 1');
    const epic2 = createEpic('E2', 'A', 'Epic 2');
    const epic3 = createEpic('E3', 'A', 'Epic 3');

    // Epic 1: 100%
    epic1.issues = [createIssue('I1', 'E1', 'A', 'Issue 1', 1, 'done', 8)];

    // Epic 2: 0%
    epic2.issues = [createIssue('I2', 'E2', 'A', 'Issue 2', 1, 'todo', 13)];

    // Epic 3: 50%
    epic3.issues = [
      createIssue('I3-1', 'E3', 'A', 'Issue 3-1', 1, 'done', 5),
      createIssue('I3-2', 'E3', 'A', 'Issue 3-2', 1, 'todo', 5),
    ];

    project.epics = [epic1, epic2, epic3];

    const sorted = sortTree([project], 'progress', 'asc');
    expect(sorted[0].epics?.map((e) => e.id)).toEqual(['E2', 'E3', 'E1']); // 0%, 50%, 100%
  });

  it('should handle projects with no story points (count by issue count)', () => {
    const projectA = createProject('A', 'Project A');
    const projectB = createProject('B', 'Project B');

    const epicA1 = createEpic('A1', 'A', 'Epic A1');
    const epicB1 = createEpic('B1', 'B', 'Epic B1');

    // Project A: 1 done, 1 todo = 50%
    epicA1.issues = [
      createIssue('A1-1', 'A1', 'A', 'Issue 1', 1, 'done', null),
      createIssue('A1-2', 'A1', 'A', 'Issue 2', 1, 'todo', null),
    ];
    projectA.epics = [epicA1];

    // Project B: 0 done, 2 todo = 0%
    epicB1.issues = [
      createIssue('B1-1', 'B1', 'B', 'Issue 1', 1, 'todo', null),
      createIssue('B1-2', 'B1', 'B', 'Issue 2', 1, 'todo', null),
    ];
    projectB.epics = [epicB1];

    const projects = [projectA, projectB];
    const sorted = sortTree(projects, 'progress', 'asc');

    expect(sorted.map((p) => p.id)).toEqual(['B', 'A']); // 0%, 50%
  });

  it('should return 0% progress for projects with empty epics (no issues)', () => {
    const projectA = createProject('A', 'Project A');
    const projectB = createProject('B', 'Project B');

    const epicA1 = createEpic('A1', 'A', 'Epic A1');
    const epicB1 = createEpic('B1', 'B', 'Epic B1');

    // Project A: empty epic (no issues at all) → 0%
    epicA1.issues = [];
    projectA.epics = [epicA1];

    // Project B: 1 done issue → 100%
    epicB1.issues = [createIssue('B1-1', 'B1', 'B', 'Issue 1', 1, 'done', 5)];
    projectB.epics = [epicB1];

    const projects = [projectB, projectA];
    const sorted = sortTree(projects, 'progress', 'asc');

    expect(sorted.map((p) => p.id)).toEqual(['A', 'B']); // 0%, 100%
  });
});

describe('sortTree - Edge Cases', () => {
  it('should return empty array for empty input', () => {
    const sorted = sortTree([], 'priority', 'asc');
    expect(sorted).toEqual([]);
  });

  it('should handle projects with no epics', () => {
    const projectA = createProject('A', 'Project A');
    const projectB = createProject('B', 'Project B');

    const projects = [projectA, projectB];
    const sorted = sortTree(projects, 'title', 'asc');

    expect(sorted.map((p) => p.id)).toEqual(['A', 'B']);
  });

  it('should handle epics with no issues', () => {
    const project = createProject('A', 'Project A');
    const epic1 = createEpic('E1', 'A', 'Zebra');
    const epic2 = createEpic('E2', 'A', 'Alpha');

    project.epics = [epic1, epic2];

    const sorted = sortTree([project], 'title', 'asc');
    expect(sorted[0].epics?.map((e) => e.name)).toEqual(['Alpha', 'Zebra']);
  });

  it('should maintain hierarchy structure after sorting', () => {
    const project = createProject('A', 'Project A');
    const epic = createEpic('E1', 'A', 'Epic 1');
    epic.issues = [
      createIssue('I2', 'E1', 'A', 'Zebra', 2),
      createIssue('I1', 'E1', 'A', 'Alpha', 0),
    ];
    project.epics = [epic];

    const sorted = sortTree([project], 'priority', 'asc');

    // Verify structure is maintained
    expect(sorted[0].epics).toBeDefined();
    expect(sorted[0].epics?.[0].issues).toBeDefined();
    expect(sorted[0].epics?.[0].issues?.length).toBe(2);
  });

  it('should not mutate original array', () => {
    const project = createProject('A', 'Project A');
    const epic = createEpic('E1', 'A', 'Epic 1');
    epic.issues = [
      createIssue('I2', 'E1', 'A', 'Zebra', 2),
      createIssue('I1', 'E1', 'A', 'Alpha', 0),
    ];
    project.epics = [epic];

    const original = [project];
    const originalIssueOrder = original[0].epics?.[0].issues?.map((i) => i.id);

    sortTree(original, 'priority', 'asc');

    // Original should be unchanged
    expect(original[0].epics?.[0].issues?.map((i) => i.id)).toEqual(originalIssueOrder);
  });
});
