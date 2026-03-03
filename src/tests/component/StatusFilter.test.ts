import { render, screen, fireEvent } from '@testing-library/svelte';
import { writable } from 'svelte/store';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { goto } from '$app/navigation';
import StatusFilter from '$lib/components/StatusFilter.svelte';
import type { Issue } from '$lib/types';

vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
}));

let mockPageStore: ReturnType<typeof writable>;

vi.mock('$app/stores', () => ({
  get page() {
    return mockPageStore;
  },
}));

const mockGoto = vi.mocked(goto);

const mockIssues: Issue[] = [
  {
    id: '1',
    project_id: 'p1',
    epic_id: 'e1',
    number: 1,
    milestone_id: null,
    title: 'Issue 1',
    description: null,
    status: 'todo',
    priority: 1,
    story_points: null,
    sort_order: 0,
    created_at: '2024-01-01',
  },
  {
    id: '2',
    project_id: 'p1',
    epic_id: 'e1',
    number: 2,
    milestone_id: null,
    title: 'Issue 2',
    description: null,
    status: 'doing',
    priority: 1,
    story_points: null,
    sort_order: 1,
    created_at: '2024-01-01',
  },
];

describe('StatusFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPageStore = writable({
      url: new URL('http://localhost/projects'),
    });
  });

  it('should render with default text when no selection', () => {
    render(StatusFilter, {
      props: { selectedStatuses: [], issues: mockIssues },
    });

    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('should show single status label when one selected', () => {
    render(StatusFilter, {
      props: { selectedStatuses: ['todo'], issues: mockIssues },
    });

    expect(screen.getByText('Status: Todo (all)')).toBeInTheDocument();
  });

  it('should show count when multiple statuses selected', () => {
    render(StatusFilter, {
      props: { selectedStatuses: ['todo', 'doing'], issues: mockIssues },
    });

    expect(screen.getByText('Status (2)')).toBeInTheDocument();
  });

  it('should display status options in popover', async () => {
    render(StatusFilter, {
      props: { selectedStatuses: [], issues: mockIssues },
    });

    const trigger = screen.getByText('Status');
    await fireEvent.click(trigger);

    // Computed options
    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText('Blocked')).toBeInTheDocument();
    // Raw status options
    expect(screen.getByText('Todo (all)')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('In Review')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.getByText('Canceled')).toBeInTheDocument();
  });

  it('should call goto when status is toggled', async () => {
    render(StatusFilter, {
      props: { selectedStatuses: [], issues: mockIssues },
    });

    const trigger = screen.getByText('Status');
    await fireEvent.click(trigger);

    const todoOption = screen.getByText('Todo (all)');
    await fireEvent.click(todoOption);

    expect(mockGoto).toHaveBeenCalledWith(
      expect.stringContaining('status=todo'),
      expect.objectContaining({ replaceState: false, noScroll: true }),
    );
  });

  it('should remove status from URL when deselecting', async () => {
    render(StatusFilter, {
      props: { selectedStatuses: ['todo'], issues: mockIssues },
    });

    const trigger = screen.getByText('Status: Todo (all)');
    await fireEvent.click(trigger);

    const todoOption = screen.getByText('Todo (all)');
    await fireEvent.click(todoOption);

    expect(mockGoto).toHaveBeenCalled();
    const calledUrl = mockGoto.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain('status=');
  });

  it('should call goto with ready when Ready is selected', async () => {
    render(StatusFilter, {
      props: { selectedStatuses: [], issues: mockIssues },
    });

    const trigger = screen.getByText('Status');
    await fireEvent.click(trigger);

    const readyOption = screen.getByText('Ready');
    await fireEvent.click(readyOption);

    expect(mockGoto).toHaveBeenCalledWith(
      expect.stringContaining('status=ready'),
      expect.objectContaining({ replaceState: false, noScroll: true }),
    );
  });

  it('should call goto with blocked when Blocked is selected', async () => {
    render(StatusFilter, {
      props: { selectedStatuses: [], issues: mockIssues },
    });

    const trigger = screen.getByText('Status');
    await fireEvent.click(trigger);

    const blockedOption = screen.getByText('Blocked');
    await fireEvent.click(blockedOption);

    expect(mockGoto).toHaveBeenCalledWith(
      expect.stringContaining('status=blocked'),
      expect.objectContaining({ replaceState: false, noScroll: true }),
    );
  });
});
