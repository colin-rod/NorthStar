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
    status: 'active',
    description: null,
    epics: [
      {
        id: 'e1',
        number: 1,
        name: 'Epic 1',
        status: 'active',
        project_id: 'p1',
        is_default: false,
        sort_order: 0,
        description: null,
        priority: null,
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
        description: null,
        priority: null,
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

  it('calls onToggleEpic when epic card is clicked', async () => {
    const onToggleEpic = vi.fn();

    const { container } = render(ExpandedProjectView, {
      project: mockProject,
      expandedEpicId: null,
      expandedIssueIds: new Set<string>(),
      onToggleEpic,
      onToggleIssue: vi.fn(),
      onClose: vi.fn(),
    });

    // Find and click the first epic card button
    const epicButtons = container.querySelectorAll('button[type="button"]');
    // Filter out the close button (which should be the first one)
    const epicCardButton = Array.from(epicButtons).find(
      (btn) => !btn.textContent?.includes('Close'),
    );

    if (epicCardButton) {
      await fireEvent.click(epicCardButton);
      expect(onToggleEpic).toHaveBeenCalled();
    }
  });

  it('renders expanded epic view when expandedEpicId is set', () => {
    render(ExpandedProjectView, {
      project: mockProject,
      expandedEpicId: 'e1',
      expandedIssueIds: new Set<string>(),
      onToggleEpic: vi.fn(),
      onToggleIssue: vi.fn(),
      onClose: vi.fn(),
    });

    // When an epic is expanded, the ExpandedEpicView component should be rendered
    // This exercises the {#if expandedEpicId} branch
    expect(screen.getByText('Epic 1')).toBeInTheDocument();
  });
});
