import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';

import ExpandedEpicView from '$lib/components/ExpandedEpicView.svelte';
import type { Epic, Issue } from '$lib/types';

describe('ExpandedEpicView', () => {
  const mockEpic: Epic = {
    id: 'epic-1',
    number: 1,
    name: 'Test Epic',
    status: 'active',
    project_id: 'project-1',
    is_default: false,
    sort_order: 0,
    description: null,
    priority: null,
  };

  const mockProject = {
    id: 'project-1',
    number: 1,
    name: 'Test Project',
    user_id: 'user-1',
    created_at: new Date().toISOString(),
    archived_at: null,
    status: 'active' as const,
    description: null,
  };

  const mockIssues: Issue[] = [
    {
      id: 'i1',
      number: 1,
      title: 'Issue 1',
      epic_id: 'epic-1',
      project_id: 'project-1',
      status: 'todo',
      priority: 0,
      sort_order: 0,
      parent_issue_id: null,
      milestone_id: null,
      story_points: null,
      dependencies: [],
      project: mockProject,
      epic: mockEpic,
      created_at: new Date().toISOString(),
      description: null,
    },
    {
      id: 'i2',
      number: 2,
      title: 'Sub-issue 1',
      epic_id: 'epic-1',
      project_id: 'project-1',
      status: 'todo',
      priority: 0,
      sort_order: 1,
      parent_issue_id: 'i1',
      milestone_id: null,
      story_points: null,
      dependencies: [],
      project: mockProject,
      epic: mockEpic,
      created_at: new Date().toISOString(),
      description: null,
    },
  ];

  it('renders epic name and status badge', () => {
    render(ExpandedEpicView, {
      epic: mockEpic,
      allIssues: mockIssues,
      expandedIssueIds: new Set<string>(),
      onToggleIssue: vi.fn(),
      onClose: vi.fn(),
      onIssueClick: vi.fn(),
    });

    expect(screen.getByText('Test Epic')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('renders close button', () => {
    render(ExpandedEpicView, {
      epic: mockEpic,
      allIssues: mockIssues,
      expandedIssueIds: new Set<string>(),
      onToggleIssue: vi.fn(),
      onClose: vi.fn(),
      onIssueClick: vi.fn(),
    });

    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  it('shows correct issue counts in tab labels', () => {
    render(ExpandedEpicView, {
      epic: mockEpic,
      allIssues: mockIssues,
      expandedIssueIds: new Set<string>(),
      onToggleIssue: vi.fn(),
      onClose: vi.fn(),
      onIssueClick: vi.fn(),
    });

    // Should show 2 issues total (parent + sub-issue)
    expect(screen.getByText(/All \(2\)/)).toBeInTheDocument();
    // Both are todo status
    expect(screen.getByText(/Todo \(2\)/)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();

    render(ExpandedEpicView, {
      epic: mockEpic,
      allIssues: mockIssues,
      expandedIssueIds: new Set<string>(),
      onToggleIssue: vi.fn(),
      onClose,
      onIssueClick: vi.fn(),
    });

    const closeButton = screen.getByRole('button', { name: /close/i });
    await fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('renders all filter tabs', () => {
    render(ExpandedEpicView, {
      epic: mockEpic,
      allIssues: mockIssues,
      expandedIssueIds: new Set<string>(),
      onToggleIssue: vi.fn(),
      onClose: vi.fn(),
      onIssueClick: vi.fn(),
    });

    // All tabs should be present
    expect(screen.getByText(/All \(2\)/)).toBeInTheDocument();
    expect(screen.getByText(/Todo \(2\)/)).toBeInTheDocument();
    expect(screen.getByText(/In Progress \(0\)/)).toBeInTheDocument();
    expect(screen.getByText(/In Review \(0\)/)).toBeInTheDocument();
    expect(screen.getByText(/Blocked \(0\)/)).toBeInTheDocument();
    expect(screen.getByText(/Done \(0\)/)).toBeInTheDocument();
    expect(screen.getByText(/Canceled \(0\)/)).toBeInTheDocument();
  });

  it('shows empty state when no issues exist', () => {
    render(ExpandedEpicView, {
      epic: mockEpic,
      allIssues: [],
      expandedIssueIds: new Set<string>(),
      onToggleIssue: vi.fn(),
      onClose: vi.fn(),
      onIssueClick: vi.fn(),
    });

    // Should show tabs with 0 counts
    expect(screen.getByText(/All \(0\)/)).toBeInTheDocument();
  });
});
