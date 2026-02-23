import { render, screen, fireEvent } from '@testing-library/svelte';
import { writable } from 'svelte/store';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { goto } from '$app/navigation';
import PriorityFilter from '$lib/components/PriorityFilter.svelte';
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
    parent_issue_id: null,
    milestone_id: null,
    title: 'Issue 1',
    description: null,
    status: 'todo',
    priority: 0,
    story_points: null,
    sort_order: 0,
    created_at: '2024-01-01',
  },
  {
    id: '2',
    project_id: 'p1',
    epic_id: 'e1',
    number: 2,
    parent_issue_id: null,
    milestone_id: null,
    title: 'Issue 2',
    description: null,
    status: 'todo',
    priority: 1,
    story_points: null,
    sort_order: 1,
    created_at: '2024-01-01',
  },
];

describe('PriorityFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPageStore = writable({
      url: new URL('http://localhost/projects'),
    });
  });

  it('should render with default text when no selection', () => {
    render(PriorityFilter, {
      props: { selectedPriorities: [], issues: mockIssues },
    });

    expect(screen.getByText('Priority')).toBeInTheDocument();
  });

  it('should show single priority label when one selected', () => {
    render(PriorityFilter, {
      props: { selectedPriorities: [0], issues: mockIssues },
    });

    expect(screen.getByText('Priority: P0')).toBeInTheDocument();
  });

  it('should show count when multiple priorities selected', () => {
    render(PriorityFilter, {
      props: { selectedPriorities: [0, 1], issues: mockIssues },
    });

    expect(screen.getByText('Priority (2)')).toBeInTheDocument();
  });

  it('should display priority options in popover', async () => {
    render(PriorityFilter, {
      props: { selectedPriorities: [], issues: mockIssues },
    });

    const trigger = screen.getByText('Priority');
    await fireEvent.click(trigger);

    expect(screen.getByText('P0 - Critical')).toBeInTheDocument();
    expect(screen.getByText('P1 - High')).toBeInTheDocument();
    expect(screen.getByText('P2 - Medium')).toBeInTheDocument();
    expect(screen.getByText('P3 - Low')).toBeInTheDocument();
  });

  it('should call goto when priority is toggled', async () => {
    render(PriorityFilter, {
      props: { selectedPriorities: [], issues: mockIssues },
    });

    const trigger = screen.getByText('Priority');
    await fireEvent.click(trigger);

    const p0Option = screen.getByText('P0 - Critical');
    await fireEvent.click(p0Option);

    expect(mockGoto).toHaveBeenCalledWith(
      expect.stringContaining('priority=0'),
      expect.objectContaining({ replaceState: false, noScroll: true }),
    );
  });

  it('should remove priority from URL when deselecting', async () => {
    render(PriorityFilter, {
      props: { selectedPriorities: [0], issues: mockIssues },
    });

    const trigger = screen.getByText('Priority: P0');
    await fireEvent.click(trigger);

    const p0Option = screen.getByText('P0 - Critical');
    await fireEvent.click(p0Option);

    expect(mockGoto).toHaveBeenCalled();
    const calledUrl = mockGoto.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain('priority=');
  });
});
