/**
 * Dependency Graph Tests
 *
 * Comprehensive test suite for cycle detection and dependency graph operations.
 * Target: 100% coverage (critical business logic per CLAUDE.md)
 */

import { describe, it, expect } from 'vitest';

import { topologicalSort, getBlockedIssues, getTransitiveDependencies } from './dependency-graph';

import type { Issue, Dependency } from '$lib/types';

// Test fixtures
const createIssue = (id: string, title: string = `Issue ${id}`): Issue => ({
  id,
  project_id: 'project-1',
  epic_id: 'epic-1',
  parent_issue_id: null,
  milestone_id: null,
  title,
  status: 'todo',
  priority: 1,
  story_points: null,
  sort_order: null,
  created_at: '2024-01-01T00:00:00Z',
});

const createDependency = (issueId: string, dependsOnId: string): Dependency => ({
  issue_id: issueId,
  depends_on_issue_id: dependsOnId,
});

describe('topologicalSort', () => {
  it('should sort issues with no dependencies', () => {
    const issues = [createIssue('A'), createIssue('B'), createIssue('C')];
    const dependencies: Dependency[] = [];
    const sorted = topologicalSort(issues, dependencies);
    expect(sorted).toBeTruthy();
    expect(sorted?.length).toBe(3);
  });

  it('should sort issues with linear dependencies (C <- B <- A)', () => {
    const issues = [createIssue('A'), createIssue('B'), createIssue('C')];
    const dependencies: Dependency[] = [createDependency('A', 'B'), createDependency('B', 'C')];
    const sorted = topologicalSort(issues, dependencies);
    expect(sorted).toBeTruthy();

    // C should come before B, B should come before A
    const indexA = sorted!.findIndex((i) => i.id === 'A');
    const indexB = sorted!.findIndex((i) => i.id === 'B');
    const indexC = sorted!.findIndex((i) => i.id === 'C');
    expect(indexC).toBeLessThan(indexB);
    expect(indexB).toBeLessThan(indexA);
  });

  it('should sort diamond dependency graph', () => {
    // D <- B <- A
    // D <- C <- A
    const issues = [createIssue('A'), createIssue('B'), createIssue('C'), createIssue('D')];
    const dependencies: Dependency[] = [
      createDependency('A', 'B'),
      createDependency('A', 'C'),
      createDependency('B', 'D'),
      createDependency('C', 'D'),
    ];
    const sorted = topologicalSort(issues, dependencies);
    expect(sorted).toBeTruthy();
    expect(sorted?.length).toBe(4);

    // D should come before both B and C
    // B and C should come before A
    const indexA = sorted!.findIndex((i) => i.id === 'A');
    const indexB = sorted!.findIndex((i) => i.id === 'B');
    const indexC = sorted!.findIndex((i) => i.id === 'C');
    const indexD = sorted!.findIndex((i) => i.id === 'D');
    expect(indexD).toBeLessThan(indexB);
    expect(indexD).toBeLessThan(indexC);
    expect(indexB).toBeLessThan(indexA);
    expect(indexC).toBeLessThan(indexA);
  });

  it('should return null when cycle exists (A -> B -> A)', () => {
    const issues = [createIssue('A'), createIssue('B')];
    const dependencies: Dependency[] = [createDependency('A', 'B'), createDependency('B', 'A')];
    const sorted = topologicalSort(issues, dependencies);
    expect(sorted).toBeNull();
  });

  it('should return null when transitive cycle exists', () => {
    const issues = [createIssue('A'), createIssue('B'), createIssue('C')];
    const dependencies: Dependency[] = [
      createDependency('A', 'B'),
      createDependency('B', 'C'),
      createDependency('C', 'A'),
    ];
    const sorted = topologicalSort(issues, dependencies);
    expect(sorted).toBeNull();
  });

  it('should handle empty issue list', () => {
    const issues: Issue[] = [];
    const dependencies: Dependency[] = [];
    const sorted = topologicalSort(issues, dependencies);
    expect(sorted).toEqual([]);
  });

  it('should handle single issue', () => {
    const issues = [createIssue('A')];
    const dependencies: Dependency[] = [];
    const sorted = topologicalSort(issues, dependencies);
    expect(sorted).toEqual(issues);
  });
});

describe('getBlockedIssues', () => {
  it('should return issues that depend on given issue', () => {
    const dependencies: Dependency[] = [
      createDependency('A', 'B'),
      createDependency('C', 'B'),
      createDependency('D', 'E'),
    ];
    const blocked = getBlockedIssues('B', dependencies);
    expect(blocked).toEqual(['A', 'C']);
  });

  it('should return empty array when no issues depend on given issue', () => {
    const dependencies: Dependency[] = [createDependency('A', 'B'), createDependency('C', 'D')];
    const blocked = getBlockedIssues('E', dependencies);
    expect(blocked).toEqual([]);
  });

  it('should return empty array for empty dependency graph', () => {
    const dependencies: Dependency[] = [];
    const blocked = getBlockedIssues('A', dependencies);
    expect(blocked).toEqual([]);
  });

  it('should return single issue when only one depends on it', () => {
    const dependencies: Dependency[] = [createDependency('A', 'B')];
    const blocked = getBlockedIssues('B', dependencies);
    expect(blocked).toEqual(['A']);
  });
});

describe('getTransitiveDependencies', () => {
  it('should return direct dependencies', () => {
    const dependencies: Dependency[] = [createDependency('A', 'B'), createDependency('A', 'C')];
    const transitive = getTransitiveDependencies('A', dependencies);
    expect(transitive).toEqual(new Set(['B', 'C']));
  });

  it('should return transitive dependencies (A -> B -> C -> D)', () => {
    const dependencies: Dependency[] = [
      createDependency('A', 'B'),
      createDependency('B', 'C'),
      createDependency('C', 'D'),
    ];
    const transitive = getTransitiveDependencies('A', dependencies);
    expect(transitive).toEqual(new Set(['B', 'C', 'D']));
  });

  it('should return all dependencies in diamond graph', () => {
    // A -> B -> D
    // A -> C -> D
    const dependencies: Dependency[] = [
      createDependency('A', 'B'),
      createDependency('A', 'C'),
      createDependency('B', 'D'),
      createDependency('C', 'D'),
    ];
    const transitive = getTransitiveDependencies('A', dependencies);
    expect(transitive).toEqual(new Set(['B', 'C', 'D']));
  });

  it('should return empty set when issue has no dependencies', () => {
    const dependencies: Dependency[] = [createDependency('B', 'C')];
    const transitive = getTransitiveDependencies('A', dependencies);
    expect(transitive).toEqual(new Set());
  });

  it('should return empty set for empty dependency graph', () => {
    const dependencies: Dependency[] = [];
    const transitive = getTransitiveDependencies('A', dependencies);
    expect(transitive).toEqual(new Set());
  });

  it('should handle cycles gracefully (not infinite loop)', () => {
    // A -> B -> C -> A (cycle)
    const dependencies: Dependency[] = [
      createDependency('A', 'B'),
      createDependency('B', 'C'),
      createDependency('C', 'A'),
    ];
    const transitive = getTransitiveDependencies('A', dependencies);
    // Should return all nodes in the cycle without infinite loop
    expect(transitive.size).toBeGreaterThan(0);
    expect(transitive.has('B')).toBe(true);
    expect(transitive.has('C')).toBe(true);
    expect(transitive.has('A')).toBe(true);
  });
});
