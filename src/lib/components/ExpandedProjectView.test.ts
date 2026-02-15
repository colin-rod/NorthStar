import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';

import ExpandedProjectView from '$lib/components/ExpandedProjectView.svelte';
import type { Epic, Issue, Project } from '$lib/types';
import type { IssueCounts } from '$lib/utils/issue-counts';

describe('ExpandedProjectView', () => {
  const mockProject: Project & {
    epics?: (Epic & { counts: IssueCounts })[];
    issues?: Issue[];
  } = {
    id: 'p1',
    number: 1,
    name: 'Test Project',
    user_id: 'user-1',
    created_at: new Date().toISOString(),
    archived_at: null,
    epics: [
      {
        id: 'e1',
        number: 1,
        name: 'Epic 1',
        status: 'active',
        project_id: 'p1',
        is_default: false,
        sort_order: 0,
        counts: { ready: 2, blocked: 0, doing: 0, inReview: 0, done: 0, canceled: 0 },
      },
      {
        id: 'e2',
        number: 2,
        name: 'Epic 2',
        status: 'active',
        project_id: 'p1',
        is_default: false,
        sort_order: 1,
        counts: { ready: 1, blocked: 0, doing: 0, inReview: 0, done: 0, canceled: 0 },
      },
    ],
    issues: [],
  };

  it('renders project name and close button', () => {
    render(ExpandedProjectView, {
      project: mockProject,
      expandedEpicId: null,
      expandedIssueIds: new Set<string>(),
      onToggleEpic: vi.fn(),
      onToggleIssue: vi.fn(),
      onClose: vi.fn(),
    });

    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  it('renders epic cards in grid', () => {
    render(ExpandedProjectView, {
      project: mockProject,
      expandedEpicId: null,
      expandedIssueIds: new Set<string>(),
      onToggleEpic: vi.fn(),
      onToggleIssue: vi.fn(),
      onClose: vi.fn(),
    });

    expect(screen.getByText('Epic 1')).toBeInTheDocument();
    expect(screen.getByText('Epic 2')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();

    render(ExpandedProjectView, {
      project: mockProject,
      expandedEpicId: null,
      expandedIssueIds: new Set<string>(),
      onToggleEpic: vi.fn(),
      onToggleIssue: vi.fn(),
      onClose,
    });

    const closeButton = screen.getByRole('button', { name: /close/i });
    await fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('shows empty state when project has no epics', () => {
    const emptyProject = { ...mockProject, epics: [] };

    render(ExpandedProjectView, {
      project: emptyProject,
      expandedEpicId: null,
      expandedIssueIds: new Set<string>(),
      onToggleEpic: vi.fn(),
      onToggleIssue: vi.fn(),
      onClose: vi.fn(),
    });

    expect(screen.getByText(/No epics in this project/)).toBeInTheDocument();
  });
});
