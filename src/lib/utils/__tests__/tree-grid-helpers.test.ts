import { describe, it, expect } from 'vitest';

import { isLastChild } from '../tree-grid-helpers';

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
      in_progress: 0,
      in_review: 0,
      done: 0,
      canceled: 0,
    },
    metrics: {
      totalPoints: null,
      pointsCompleted: null,
      progressPercentage: null,
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
