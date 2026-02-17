import { describe, it, expect } from 'vitest';

import type { Project, Epic, Issue } from '$lib/types';
import type { TreeNode } from '$lib/types/tree-grid';
import { buildBreadcrumb } from '$lib/utils/breadcrumb';

describe('buildBreadcrumb', () => {
  // Helper to create mock nodes
  const mockProject: Project = {
    id: 'proj-1',
    user_id: 'user-1',
    number: 1,
    name: 'Personal Tasks',
    created_at: '2024-01-01',
    archived_at: null,
  };

  const mockEpic: Epic = {
    id: 'epic-1',
    project_id: 'proj-1',
    number: 3,
    name: 'Backend',
    status: 'active',
    is_default: false,
    sort_order: 1,
  };

  const mockIssue: Issue = {
    id: 'issue-1',
    project_id: 'proj-1',
    epic_id: 'epic-1',
    number: 2,
    parent_issue_id: null,
    milestone_id: null,
    title: 'Implement authentication API',
    status: 'doing',
    priority: 0,
    story_points: 8,
    sort_order: 1,
    created_at: '2024-01-01',
  };

  const projectNode: TreeNode = {
    id: 'proj-1',
    type: 'project',
    level: 0,
    parentId: null,
    hasChildren: true,
    data: mockProject,
    counts: { ready: 0, doing: 0, blocked: 0, inReview: 0, done: 0, canceled: 0 },
    metrics: { totalIssues: 0, activeStoryPoints: 0, totalStoryPoints: 0 },
    totalPoints: 0,
    progress: null,
  };

  const epicNode: TreeNode = {
    id: 'epic-1',
    type: 'epic',
    level: 1,
    parentId: 'proj-1',
    hasChildren: true,
    data: mockEpic,
    counts: { ready: 0, doing: 0, blocked: 0, inReview: 0, done: 0, canceled: 0 },
    metrics: { totalIssues: 0, activeStoryPoints: 0, totalStoryPoints: 0 },
    totalPoints: 0,
    progress: null,
  };

  const issueNode: TreeNode = {
    id: 'issue-1',
    type: 'issue',
    level: 2,
    parentId: 'epic-1',
    hasChildren: false,
    data: mockIssue,
    counts: { ready: 0, doing: 0, blocked: 0, inReview: 0, done: 0, canceled: 0 },
    metrics: { totalIssues: 0, activeStoryPoints: 0, totalStoryPoints: 0 },
    totalPoints: null,
    progress: null,
  };

  const allNodes: TreeNode[] = [projectNode, epicNode, issueNode];

  it('should return empty string when expandedId is null', () => {
    const result = buildBreadcrumb(null, allNodes);
    expect(result).toBe('');
  });

  it('should return project breadcrumb when project is expanded', () => {
    const result = buildBreadcrumb('proj-1', allNodes);
    expect(result).toBe('P-1 Personal Tasks');
  });

  it('should return project > epic breadcrumb when epic is expanded', () => {
    const result = buildBreadcrumb('epic-1', allNodes);
    expect(result).toBe('P-1 Personal Tasks / E-3 Backend');
  });

  it('should return full path when issue is expanded', () => {
    const result = buildBreadcrumb('issue-1', allNodes);
    expect(result).toBe('P-1 Personal Tasks / E-3 Backend / I-2 Implement authentication API');
  });

  it('should handle node not found by returning empty string', () => {
    const result = buildBreadcrumb('nonexistent-id', allNodes);
    expect(result).toBe('');
  });
});
