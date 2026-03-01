import { render, screen, fireEvent } from '@testing-library/svelte';
import { writable } from 'svelte/store';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { goto } from '$app/navigation';
import StoryPointsFilter from '$lib/components/StoryPointsFilter.svelte';
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
    priority: 1,
    story_points: 3,
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

describe('StoryPointsFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPageStore = writable({
      url: new URL('http://localhost/projects'),
    });
  });

  it('should render with default text when no selection', () => {
    render(StoryPointsFilter, {
      props: { selectedStoryPoints: [], issues: mockIssues },
    });

    expect(screen.getByText('Story Points')).toBeInTheDocument();
  });

  it('should show single value when one selected', () => {
    render(StoryPointsFilter, {
      props: { selectedStoryPoints: ['3'], issues: mockIssues },
    });

    expect(screen.getByText('Story Points: 3')).toBeInTheDocument();
  });

  it('should show count when multiple selected', () => {
    render(StoryPointsFilter, {
      props: { selectedStoryPoints: ['3', 'none'], issues: mockIssues },
    });

    expect(screen.getByText('Story Points (2)')).toBeInTheDocument();
  });

  it('should display options in popover', async () => {
    render(StoryPointsFilter, {
      props: { selectedStoryPoints: [], issues: mockIssues },
    });

    const trigger = screen.getByText('Story Points');
    await fireEvent.click(trigger);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('None')).toBeInTheDocument();
  });

  it('should call goto when story point is toggled', async () => {
    render(StoryPointsFilter, {
      props: { selectedStoryPoints: [], issues: mockIssues },
    });

    const trigger = screen.getByText('Story Points');
    await fireEvent.click(trigger);

    const option3 = screen.getByText('3');
    await fireEvent.click(option3);

    expect(mockGoto).toHaveBeenCalledWith(
      expect.stringContaining('story_points=3'),
      expect.objectContaining({ replaceState: false, noScroll: true }),
    );
  });

  it('should remove story_points from URL when deselecting all', async () => {
    render(StoryPointsFilter, {
      props: { selectedStoryPoints: ['3'], issues: mockIssues },
    });

    const trigger = screen.getByText('Story Points: 3');
    await fireEvent.click(trigger);

    const option3 = screen.getByText('3');
    await fireEvent.click(option3);

    expect(mockGoto).toHaveBeenCalled();
    const calledUrl = mockGoto.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain('story_points=');
  });
});
