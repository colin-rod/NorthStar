/**
 * TDD Tests for ContextMenu component
 * RED phase: Tests written before implementation
 */
import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';

import ContextMenu from '$lib/components/ContextMenu.svelte';
import type { Project, Epic, Issue } from '$lib/types';
import type { TreeNode } from '$lib/types/tree-grid';

// --- Node factories ---

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'proj-1',
    user_id: 'user-1',
    number: 1,
    name: 'Test Project',
    description: null,
    created_at: new Date().toISOString(),
    archived_at: null,
    status: 'active',
    ...overrides,
  };
}

function makeEpic(overrides: Partial<Epic> = {}): Epic {
  return {
    id: 'epic-1',
    project_id: 'proj-1',
    number: 1,
    name: 'Test Epic',
    description: null,
    status: 'active',
    is_default: false,
    sort_order: 0,
    ...overrides,
  };
}

function makeIssue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: 'issue-1',
    project_id: 'proj-1',
    epic_id: 'epic-1',
    number: 1,
    parent_issue_id: null,
    milestone_id: null,
    title: 'Test Issue',
    description: null,
    status: 'todo',
    priority: 2,
    story_points: null,
    sort_order: 0,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

const emptyCounts = { ready: 0, blocked: 0, doing: 0, inReview: 0, done: 0, canceled: 0 };
const emptyMetrics = { totalIssues: 0, activeStoryPoints: 0, totalStoryPoints: 0 };

function makeProjectNode(overrides: Partial<TreeNode> = {}): TreeNode {
  return {
    id: 'proj-1',
    type: 'project',
    level: 0,
    parentId: null,
    hasChildren: true,
    data: makeProject(),
    counts: emptyCounts,
    metrics: emptyMetrics,
    totalPoints: 0,
    progress: null,
    ...overrides,
  };
}

function makeEpicNode(overrides: Partial<TreeNode> = {}): TreeNode {
  return {
    id: 'epic-1',
    type: 'epic',
    level: 1,
    parentId: 'proj-1',
    hasChildren: true,
    data: makeEpic(),
    counts: emptyCounts,
    metrics: emptyMetrics,
    totalPoints: 0,
    progress: null,
    ...overrides,
  };
}

function makeIssueNode(overrides: Partial<TreeNode> = {}): TreeNode {
  return {
    id: 'issue-1',
    type: 'issue',
    level: 2,
    parentId: 'epic-1',
    hasChildren: false,
    data: makeIssue(),
    counts: emptyCounts,
    metrics: emptyMetrics,
    totalPoints: null,
    progress: null,
    ...overrides,
  };
}

function makeSubIssueNode(overrides: Partial<TreeNode> = {}): TreeNode {
  return {
    id: 'sub-1',
    type: 'sub-issue',
    level: 3,
    parentId: 'issue-1',
    hasChildren: false,
    data: makeIssue({ id: 'sub-1', parent_issue_id: 'issue-1' }),
    counts: emptyCounts,
    metrics: emptyMetrics,
    totalPoints: null,
    progress: null,
    ...overrides,
  };
}

// --- Shared render helper ---

function renderMenu(node: TreeNode | null, callbacks: Record<string, any> = {}) {
  return render(ContextMenu, {
    props: {
      node,
      x: 100,
      y: 100,
      open: node !== null,
      onClose: (callbacks.onClose ?? vi.fn()) as () => void,
      onRename: (callbacks.onRename ?? vi.fn()) as (n: TreeNode) => void,
      onStatusChange: (callbacks.onStatusChange ?? vi.fn()) as (n: TreeNode, s: string) => void,
      onAddChild: (callbacks.onAddChild ?? vi.fn()) as (n: TreeNode) => void,
      onArchive: (callbacks.onArchive ?? vi.fn()) as (n: TreeNode) => void,
      onDelete: (callbacks.onDelete ?? vi.fn()) as (n: TreeNode) => void,
      onPriorityChange: (callbacks.onPriorityChange ?? vi.fn()) as (n: TreeNode, p: number) => void,
      onStoryPointsChange: (callbacks.onStoryPointsChange ?? vi.fn()) as (
        n: TreeNode,
        sp: number,
      ) => void,
    },
  });
}

// --- Tests ---

describe('ContextMenu — no node', () => {
  it('renders nothing when node is null', () => {
    renderMenu(null);
    expect(screen.queryByText('Rename')).toBeNull();
    expect(screen.queryByText('Delete')).toBeNull();
  });
});

describe('ContextMenu — project node', () => {
  it('shows Rename for project', () => {
    renderMenu(makeProjectNode());
    expect(screen.getByText('Rename')).toBeTruthy();
  });

  it('shows Add Epic for project', () => {
    renderMenu(makeProjectNode());
    expect(screen.getByText('Add Epic')).toBeTruthy();
  });

  it('shows Archive for project', () => {
    renderMenu(makeProjectNode());
    expect(screen.getByText('Archive')).toBeTruthy();
  });

  it('shows Delete for project', () => {
    renderMenu(makeProjectNode());
    expect(screen.getByText('Delete')).toBeTruthy();
  });

  it('shows Status submenu trigger for project', () => {
    renderMenu(makeProjectNode());
    expect(screen.getByText('Status')).toBeTruthy();
  });

  it('does NOT show Add Issue or Add Sub-issue for project', () => {
    renderMenu(makeProjectNode());
    expect(screen.queryByText('Add Issue')).toBeNull();
    expect(screen.queryByText('Add Sub-issue')).toBeNull();
  });

  it('calls onRename when Rename is clicked', async () => {
    const onRename = vi.fn();
    renderMenu(makeProjectNode(), { onRename });
    await fireEvent.click(screen.getByText('Rename'));
    expect(onRename).toHaveBeenCalledOnce();
  });

  it('calls onAddChild when Add Epic is clicked', async () => {
    const onAddChild = vi.fn();
    renderMenu(makeProjectNode(), { onAddChild });
    await fireEvent.click(screen.getByText('Add Epic'));
    expect(onAddChild).toHaveBeenCalledOnce();
  });

  it('calls onArchive when Archive is clicked', async () => {
    const onArchive = vi.fn();
    renderMenu(makeProjectNode(), { onArchive });
    await fireEvent.click(screen.getByText('Archive'));
    expect(onArchive).toHaveBeenCalledOnce();
  });
});

describe('ContextMenu — epic node', () => {
  it('shows Rename for epic', () => {
    renderMenu(makeEpicNode());
    expect(screen.getByText('Rename')).toBeTruthy();
  });

  it('shows Status submenu trigger for epic', () => {
    renderMenu(makeEpicNode());
    expect(screen.getByText('Status')).toBeTruthy();
  });

  it('shows Add Issue for epic', () => {
    renderMenu(makeEpicNode());
    expect(screen.getByText('Add Issue')).toBeTruthy();
  });

  it('shows Delete for epic', () => {
    renderMenu(makeEpicNode());
    expect(screen.getByText('Delete')).toBeTruthy();
  });

  it('does NOT show Archive for epic', () => {
    renderMenu(makeEpicNode());
    expect(screen.queryByText('Archive')).toBeNull();
  });

  it('does NOT show Add Sub-issue for epic', () => {
    renderMenu(makeEpicNode());
    expect(screen.queryByText('Add Sub-issue')).toBeNull();
  });

  it('calls onRename when Rename is clicked', async () => {
    const onRename = vi.fn();
    renderMenu(makeEpicNode(), { onRename });
    await fireEvent.click(screen.getByText('Rename'));
    expect(onRename).toHaveBeenCalledOnce();
  });

  it('calls onAddChild when Add Issue is clicked', async () => {
    const onAddChild = vi.fn();
    renderMenu(makeEpicNode(), { onAddChild });
    await fireEvent.click(screen.getByText('Add Issue'));
    expect(onAddChild).toHaveBeenCalledOnce();
  });
});

describe('ContextMenu — issue node', () => {
  it('shows Status submenu trigger for issue', () => {
    renderMenu(makeIssueNode());
    expect(screen.getByText('Status')).toBeTruthy();
  });

  it('shows Priority submenu trigger for issue', () => {
    renderMenu(makeIssueNode());
    expect(screen.getByText('Priority')).toBeTruthy();
  });

  it('shows Story Points submenu trigger for issue', () => {
    renderMenu(makeIssueNode());
    expect(screen.getByText('Story Points')).toBeTruthy();
  });

  it('shows Add Sub-issue for issue', () => {
    renderMenu(makeIssueNode());
    expect(screen.getByText('Add Sub-issue')).toBeTruthy();
  });

  it('shows Delete for issue', () => {
    renderMenu(makeIssueNode());
    expect(screen.getByText('Delete')).toBeTruthy();
  });

  it('does NOT show Rename for issue', () => {
    renderMenu(makeIssueNode());
    expect(screen.queryByText('Rename')).toBeNull();
  });

  it('does NOT show Archive for issue', () => {
    renderMenu(makeIssueNode());
    expect(screen.queryByText('Archive')).toBeNull();
  });

  it('calls onAddChild when Add Sub-issue is clicked', async () => {
    const onAddChild = vi.fn();
    renderMenu(makeIssueNode(), { onAddChild });
    await fireEvent.click(screen.getByText('Add Sub-issue'));
    expect(onAddChild).toHaveBeenCalledOnce();
  });
});

describe('ContextMenu — sub-issue node', () => {
  it('shows Status submenu trigger for sub-issue', () => {
    renderMenu(makeSubIssueNode());
    expect(screen.getByText('Status')).toBeTruthy();
  });

  it('shows Priority submenu trigger for sub-issue', () => {
    renderMenu(makeSubIssueNode());
    expect(screen.getByText('Priority')).toBeTruthy();
  });

  it('shows Story Points submenu trigger for sub-issue', () => {
    renderMenu(makeSubIssueNode());
    expect(screen.getByText('Story Points')).toBeTruthy();
  });

  it('shows Delete for sub-issue', () => {
    renderMenu(makeSubIssueNode());
    expect(screen.getByText('Delete')).toBeTruthy();
  });

  it('does NOT show Add Sub-issue for sub-issue', () => {
    renderMenu(makeSubIssueNode());
    expect(screen.queryByText('Add Sub-issue')).toBeNull();
  });

  it('does NOT show Rename for sub-issue', () => {
    renderMenu(makeSubIssueNode());
    expect(screen.queryByText('Rename')).toBeNull();
  });

  it('does NOT show Archive for sub-issue', () => {
    renderMenu(makeSubIssueNode());
    expect(screen.queryByText('Archive')).toBeNull();
  });
});

describe('ContextMenu — delete confirmation', () => {
  it('shows confirmation dialog when Delete is clicked', async () => {
    renderMenu(makeIssueNode());
    await fireEvent.click(screen.getByText('Delete'));
    expect(screen.getByText('Are you sure?')).toBeTruthy();
  });

  it('does NOT call onDelete without confirmation', async () => {
    const onDelete = vi.fn();
    renderMenu(makeIssueNode(), { onDelete });
    await fireEvent.click(screen.getByText('Delete'));
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('calls onDelete after confirmation', async () => {
    const onDelete = vi.fn();
    renderMenu(makeIssueNode(), { onDelete });
    await fireEvent.click(screen.getByText('Delete'));
    await fireEvent.click(screen.getByText('Confirm'));
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('does NOT call onDelete when confirmation is canceled', async () => {
    const onDelete = vi.fn();
    renderMenu(makeIssueNode(), { onDelete });
    await fireEvent.click(screen.getByText('Delete'));
    await fireEvent.click(screen.getByText('Cancel'));
    expect(onDelete).not.toHaveBeenCalled();
  });
});
