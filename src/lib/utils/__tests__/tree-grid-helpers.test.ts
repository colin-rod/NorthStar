import { describe, it, expect } from 'vitest';

import {
  isLastChild,
  flattenTree,
  getVisibleNodes,
  calculateIndentation,
  getDescendantNodes,
  getDescendantIssues,
} from '../tree-grid-helpers';

import type { Project, Issue } from '$lib/types';
import type { TreeNode } from '$lib/types/tree-grid';

// Helper to create mock tree nodes
function createMockNode(
  id: string,
  type: 'project' | 'epic' | 'issue' | 'sub-issue',
  level: 0 | 1 | 2 | 3,
  parentId: string | null = null,
): TreeNode {
  return {
    id,
    type,
    level,
    parentId,
    hasChildren: false,
    data: {} as any,
    counts: {
      ready: 0,
      blocked: 0,
      doing: 0,
      inReview: 0,
      done: 0,
      canceled: 0,
    },
    metrics: {
      totalIssues: 0,
      activeStoryPoints: 0,
      totalStoryPoints: 0,
    },
    totalPoints: null,
    progress: null,
  };
}

describe('isLastChild', () => {
  it('should return false for top-level nodes (no parent)', () => {
    const nodes: TreeNode[] = [
      createMockNode('project1', 'project', 0),
      createMockNode('project2', 'project', 0),
    ];

    expect(isLastChild(nodes[0], nodes)).toBe(false);
    expect(isLastChild(nodes[1], nodes)).toBe(false);
  });

  it('should return true for last child among siblings', () => {
    const nodes: TreeNode[] = [
      createMockNode('project1', 'project', 0),
      createMockNode('epic1', 'epic', 1, 'project1'),
      createMockNode('epic2', 'epic', 1, 'project1'),
      createMockNode('epic3', 'epic', 1, 'project1'),
    ];

    expect(isLastChild(nodes[1], nodes)).toBe(false); // epic1 - first child
    expect(isLastChild(nodes[2], nodes)).toBe(false); // epic2 - middle child
    expect(isLastChild(nodes[3], nodes)).toBe(true); // epic3 - last child
  });

  it('should return true for single child', () => {
    const nodes: TreeNode[] = [
      createMockNode('project1', 'project', 0),
      createMockNode('epic1', 'epic', 1, 'project1'),
    ];

    expect(isLastChild(nodes[1], nodes)).toBe(true);
  });

  it('should correctly identify last child in visible nodes only', () => {
    // Simulate scenario where some siblings are visible
    const visibleNodes: TreeNode[] = [
      createMockNode('project1', 'project', 0),
      createMockNode('epic1', 'epic', 1, 'project1'),
      createMockNode('epic3', 'epic', 1, 'project1'),
      // epic2 is not in visible nodes (parent collapsed)
    ];

    expect(isLastChild(visibleNodes[1], visibleNodes)).toBe(false); // epic1
    expect(isLastChild(visibleNodes[2], visibleNodes)).toBe(true); // epic3
  });

  it('should handle deeply nested hierarchies', () => {
    const nodes: TreeNode[] = [
      createMockNode('project1', 'project', 0),
      createMockNode('epic1', 'epic', 1, 'project1'),
      createMockNode('issue1', 'issue', 2, 'epic1'),
      createMockNode('issue2', 'issue', 2, 'epic1'),
      createMockNode('subissue1', 'sub-issue', 3, 'issue2'),
      createMockNode('subissue2', 'sub-issue', 3, 'issue2'),
    ];

    expect(isLastChild(nodes[2], nodes)).toBe(false); // issue1 - not last
    expect(isLastChild(nodes[3], nodes)).toBe(true); // issue2 - last issue under epic1
    expect(isLastChild(nodes[4], nodes)).toBe(false); // subissue1 - not last
    expect(isLastChild(nodes[5], nodes)).toBe(true); // subissue2 - last under issue2
  });

  it('should handle nodes from different parents correctly', () => {
    const nodes: TreeNode[] = [
      createMockNode('project1', 'project', 0),
      createMockNode('epic1', 'epic', 1, 'project1'),
      createMockNode('epic2', 'epic', 1, 'project1'),
      createMockNode('issue1', 'issue', 2, 'epic1'),
      createMockNode('issue2', 'issue', 2, 'epic2'),
    ];

    // issue1 is the only child of epic1, so it's last
    expect(isLastChild(nodes[3], nodes)).toBe(true);
    // issue2 is the only child of epic2, so it's last
    expect(isLastChild(nodes[4], nodes)).toBe(true);
  });
});

describe('flattenTree', () => {
  it('should return empty array for empty projects array', () => {
    const result = flattenTree([]);
    expect(result).toEqual([]);
  });

  it('should create project node for single project with no epics', () => {
    const projects: Project[] = [
      {
        id: 'project1',
        number: 1,
        name: 'Test Project',
        user_id: 'user1',
        created_at: new Date().toISOString(),
        archived_at: null,
        description: null,
      },
    ];

    const result = flattenTree(projects);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'project1',
      type: 'project',
      level: 0,
      parentId: null,
      hasChildren: false,
    });
  });

  it('should flatten project with epics but no issues', () => {
    const projects = [
      {
        id: 'project1',
        number: 1,
        name: 'Test Project',
        user_id: 'user1',
        created_at: new Date().toISOString(),
        archived_at: null,
        description: null,
        epics: [
          {
            id: 'epic1',
            project_id: 'project1',
            number: 1,
            name: 'Epic 1',
            status: 'active' as const,
            is_default: false,
            sort_order: 0,
            description: null,
          },
          {
            id: 'epic2',
            project_id: 'project1',
            number: 2,
            name: 'Epic 2',
            status: 'active' as const,
            is_default: false,
            sort_order: 1,
            description: null,
          },
        ],
      },
    ];

    const result = flattenTree(projects);

    expect(result).toHaveLength(3); // 1 project + 2 epics
    expect(result[0]).toMatchObject({
      id: 'project1',
      type: 'project',
      level: 0,
      hasChildren: true,
    });
    expect(result[1]).toMatchObject({
      id: 'epic1',
      type: 'epic',
      level: 1,
      parentId: 'project1',
      hasChildren: true, // Always true for epics to enable inline issue creation
    });
    expect(result[2]).toMatchObject({
      id: 'epic2',
      type: 'epic',
      level: 1,
      parentId: 'project1',
      hasChildren: true, // Always true for epics to enable inline issue creation
    });
  });

  it('should flatten full hierarchy (project → epic → issue → sub-issue)', () => {
    const projects = [
      {
        id: 'project1',
        number: 1,
        name: 'Test Project',
        user_id: 'user1',
        created_at: new Date().toISOString(),
        archived_at: null,
        description: null,
        epics: [
          {
            id: 'epic1',
            project_id: 'project1',
            number: 1,
            name: 'Epic 1',
            status: 'active' as const,
            is_default: false,
            sort_order: 0,
            description: null,
          },
        ],
        issues: [
          {
            id: 'issue1',
            project_id: 'project1',
            epic_id: 'epic1',
            title: 'Issue 1',
            status: 'todo' as const,
            priority: 0,
            story_points: 5,
            sort_order: 0,
            created_at: new Date().toISOString(),
          } as Issue,
          {
            id: 'subissue1',
            project_id: 'project1',
            epic_id: 'epic1',
            parent_issue_id: 'issue1',
            title: 'Sub-issue 1',
            status: 'todo' as const,
            priority: 0,
            story_points: 3,
            sort_order: 0,
            created_at: new Date().toISOString(),
          } as Issue,
        ],
      },
    ];

    const result = flattenTree(projects);

    expect(result).toHaveLength(4); // project + epic + issue + sub-issue
    expect(result[0]).toMatchObject({ id: 'project1', type: 'project', level: 0 });
    expect(result[1]).toMatchObject({ id: 'epic1', type: 'epic', level: 1, parentId: 'project1' });
    expect(result[2]).toMatchObject({ id: 'issue1', type: 'issue', level: 2, parentId: 'epic1' });
    expect(result[3]).toMatchObject({
      id: 'subissue1',
      type: 'sub-issue',
      level: 3,
      parentId: 'issue1',
    });
  });

  it('should flatten multiple projects with mixed content', () => {
    const projects = [
      {
        id: 'project1',
        number: 1,
        name: 'Project 1',
        user_id: 'user1',
        created_at: new Date().toISOString(),
        archived_at: null,
        description: null,
        epics: [
          {
            id: 'epic1',
            project_id: 'project1',
            number: 1,
            name: 'Epic 1',
            status: 'active' as const,
            is_default: false,
            sort_order: 0,
            description: null,
          },
        ],
        issues: [
          {
            id: 'issue1',
            project_id: 'project1',
            epic_id: 'epic1',
            title: 'Issue 1',
            status: 'todo' as const,
            priority: 0,
            sort_order: 0,
            created_at: new Date().toISOString(),
          } as Issue,
        ],
      },
      {
        id: 'project2',
        number: 2,
        name: 'Project 2',
        user_id: 'user1',
        created_at: new Date().toISOString(),
        archived_at: null,
        description: null,
        epics: [],
      },
    ];

    const result = flattenTree(projects);

    expect(result).toHaveLength(4); // project1 + epic1 + issue1 + project2
    expect(result[0]).toMatchObject({ id: 'project1', type: 'project' });
    expect(result[1]).toMatchObject({ id: 'epic1', type: 'epic' });
    expect(result[2]).toMatchObject({ id: 'issue1', type: 'issue' });
    expect(result[3]).toMatchObject({ id: 'project2', type: 'project', hasChildren: false });
  });

  it('should correctly filter epic issues (only those without parent_issue_id)', () => {
    const projects = [
      {
        id: 'project1',
        number: 1,
        name: 'Project 1',
        user_id: 'user1',
        created_at: new Date().toISOString(),
        archived_at: null,
        description: null,
        epics: [
          {
            id: 'epic1',
            project_id: 'project1',
            number: 1,
            name: 'Epic 1',
            status: 'active' as const,
            is_default: false,
            sort_order: 0,
            description: null,
          },
        ],
        issues: [
          {
            id: 'issue1',
            project_id: 'project1',
            epic_id: 'epic1',
            title: 'Issue 1',
            status: 'todo' as const,
            priority: 0,
            sort_order: 0,
            created_at: new Date().toISOString(),
          } as Issue,
          {
            id: 'subissue1',
            project_id: 'project1',
            epic_id: 'epic1',
            parent_issue_id: 'issue1',
            title: 'Sub-issue 1',
            status: 'todo' as const,
            priority: 0,
            sort_order: 0,
            created_at: new Date().toISOString(),
          } as Issue,
        ],
      },
    ];

    const result = flattenTree(projects);

    // Epic should only have issue1 as direct child, not subissue1
    const epicNode = result.find((n) => n.id === 'epic1');
    expect(epicNode?.hasChildren).toBe(true);

    // Issue1 should have subissue1 as child
    const issueNode = result.find((n) => n.id === 'issue1');
    expect(issueNode?.hasChildren).toBe(true);
  });
});

describe('getVisibleNodes', () => {
  const mockNodes: TreeNode[] = [
    createMockNode('project1', 'project', 0),
    createMockNode('epic1', 'epic', 1, 'project1'),
    createMockNode('epic2', 'epic', 1, 'project1'),
    createMockNode('issue1', 'issue', 2, 'epic1'),
    createMockNode('issue2', 'issue', 2, 'epic1'),
    createMockNode('subissue1', 'sub-issue', 3, 'issue1'),
  ];

  it('should show only projects when nothing is expanded', () => {
    const expandedIds = new Set<string>();
    const result = getVisibleNodes(mockNodes, expandedIds);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('project1');
  });

  it('should show epics when project is expanded', () => {
    const expandedIds = new Set(['project1']);
    const result = getVisibleNodes(mockNodes, expandedIds);

    expect(result).toHaveLength(3);
    expect(result.map((n) => n.id)).toEqual(['project1', 'epic1', 'epic2']);
  });

  it('should show issues when epic is expanded', () => {
    const expandedIds = new Set(['project1', 'epic1']);
    const result = getVisibleNodes(mockNodes, expandedIds);

    expect(result).toHaveLength(5);
    expect(result.map((n) => n.id)).toEqual(['project1', 'epic1', 'epic2', 'issue1', 'issue2']);
  });

  it('should show sub-issues when issue is expanded', () => {
    const expandedIds = new Set(['project1', 'epic1', 'issue1']);
    const result = getVisibleNodes(mockNodes, expandedIds);

    expect(result).toHaveLength(6);
    expect(result.map((n) => n.id)).toEqual([
      'project1',
      'epic1',
      'epic2',
      'issue1',
      'issue2',
      'subissue1',
    ]);
  });

  it('should handle mixed expansion states', () => {
    // Project expanded, only epic2 expanded (not epic1)
    const expandedIds = new Set(['project1', 'epic2']);
    const result = getVisibleNodes(mockNodes, expandedIds);

    expect(result).toHaveLength(3);
    expect(result.map((n) => n.id)).toEqual(['project1', 'epic1', 'epic2']);
  });

  it('should always show projects regardless of expansion', () => {
    const nodes: TreeNode[] = [
      createMockNode('project1', 'project', 0),
      createMockNode('project2', 'project', 0),
    ];

    const expandedIds = new Set<string>();
    const result = getVisibleNodes(nodes, expandedIds);

    expect(result).toHaveLength(2);
    expect(result.map((n) => n.id)).toEqual(['project1', 'project2']);
  });
});

describe('calculateIndentation', () => {
  it('should return 0px for level 0 (project)', () => {
    expect(calculateIndentation(0)).toBe('0px');
  });

  it('should return 16px for level 1 (epic)', () => {
    expect(calculateIndentation(1)).toBe('16px');
  });

  it('should return 32px for level 2 (issue)', () => {
    expect(calculateIndentation(2)).toBe('32px');
  });

  it('should return 48px for level 3 (sub-issue)', () => {
    expect(calculateIndentation(3)).toBe('48px');
  });
});

describe('getDescendantNodes', () => {
  const mockNodes: TreeNode[] = [
    createMockNode('project1', 'project', 0),
    createMockNode('epic1', 'epic', 1, 'project1'),
    createMockNode('epic2', 'epic', 1, 'project1'),
    createMockNode('issue1', 'issue', 2, 'epic1'),
    createMockNode('issue2', 'issue', 2, 'epic1'),
    createMockNode('subissue1', 'sub-issue', 3, 'issue1'),
  ];

  it('should return empty array for node with no descendants', () => {
    const node = mockNodes.find((n) => n.id === 'subissue1')!;
    const result = getDescendantNodes(node, mockNodes);

    expect(result).toEqual([]);
  });

  it('should return direct children only for node with single level descendants', () => {
    const node = mockNodes.find((n) => n.id === 'epic2')!;
    const result = getDescendantNodes(node, mockNodes);

    expect(result).toEqual([]);
  });

  it('should return all descendants for multi-level hierarchy', () => {
    const node = mockNodes.find((n) => n.id === 'project1')!;
    const result = getDescendantNodes(node, mockNodes);

    expect(result).toHaveLength(5);
    // Depth-first order: epic1, then epic1's children (issue1, issue2, subissue1), then epic2
    expect(result.map((n) => n.id)).toEqual(['epic1', 'issue1', 'subissue1', 'issue2', 'epic2']);
  });

  it('should return all descendants for epic node', () => {
    const node = mockNodes.find((n) => n.id === 'epic1')!;
    const result = getDescendantNodes(node, mockNodes);

    expect(result).toHaveLength(3);
    // Depth-first order: issue1, subissue1, issue2
    expect(result.map((n) => n.id)).toEqual(['issue1', 'subissue1', 'issue2']);
  });

  it('should return only direct sub-issue for issue node', () => {
    const node = mockNodes.find((n) => n.id === 'issue1')!;
    const result = getDescendantNodes(node, mockNodes);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('subissue1');
  });
});

describe('getDescendantIssues', () => {
  const mockNodes: TreeNode[] = [
    createMockNode('project1', 'project', 0),
    createMockNode('epic1', 'epic', 1, 'project1'),
    createMockNode('epic2', 'epic', 1, 'project1'),
    createMockNode('issue1', 'issue', 2, 'epic1'),
    createMockNode('issue2', 'issue', 2, 'epic1'),
    createMockNode('subissue1', 'sub-issue', 3, 'issue1'),
  ];

  it('should return only issue and sub-issue nodes from descendants', () => {
    const node = mockNodes.find((n) => n.id === 'project1')!;
    const result = getDescendantIssues(node, mockNodes);

    expect(result).toHaveLength(3);
    // Filters to only issues/sub-issues, maintaining depth-first order
    expect(result.map((n) => n.id)).toEqual(['issue1', 'subissue1', 'issue2']);
  });

  it('should filter out epic nodes from descendants', () => {
    const node = mockNodes.find((n) => n.id === 'project1')!;
    const result = getDescendantIssues(node, mockNodes);

    expect(result.every((n) => n.type === 'issue' || n.type === 'sub-issue')).toBe(true);
  });

  it('should return empty array for epic with no issues', () => {
    const node = mockNodes.find((n) => n.id === 'epic2')!;
    const result = getDescendantIssues(node, mockNodes);

    expect(result).toEqual([]);
  });

  it('should return issues and sub-issues for epic node', () => {
    const node = mockNodes.find((n) => n.id === 'epic1')!;
    const result = getDescendantIssues(node, mockNodes);

    expect(result).toHaveLength(3);
    // Filters to only issues/sub-issues, maintaining depth-first order
    expect(result.map((n) => n.id)).toEqual(['issue1', 'subissue1', 'issue2']);
  });

  it('should return only sub-issues for issue node', () => {
    const node = mockNodes.find((n) => n.id === 'issue1')!;
    const result = getDescendantIssues(node, mockNodes);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('subissue1');
  });
});
