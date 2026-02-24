import { fireEvent, render, screen } from '@testing-library/svelte';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

import IssueSheet from '$lib/components/IssueSheet.svelte';
import { supabase } from '$lib/supabase';
import type { Epic, Issue } from '$lib/types';

vi.mock('$lib/components/RichTextEditor.svelte', async () => {
  const mod = await import('./mocks/RichTextEditor.mock.svelte');
  return { default: mod.default };
});

vi.mock('$lib/hooks/useMediaQuery.svelte', () => ({
  useMediaQuery: () => () => true,
}));

vi.mock('$lib/hooks/useKeyboardAwareHeight.svelte', () => ({
  useKeyboardAwareHeight: vi.fn(),
}));

function makeIssue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: 'issue-1',
    project_id: 'project-1',
    epic_id: 'epic-1',
    number: 1,
    parent_issue_id: null,
    milestone_id: null,
    title: 'Issue One',
    description: '<p>original description</p>',
    status: 'todo',
    priority: 2,
    story_points: null,
    sort_order: 0,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

const mockEpics: Epic[] = [
  {
    id: 'epic-1',
    project_id: 'project-1',
    number: 1,
    name: 'Epic One',
    description: null,
    status: 'active',
    priority: null,
    is_default: false,
    sort_order: 0,
    milestone_id: null,
  },
];

describe('IssueSheet description auto-save guards', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ type: 'success' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    (supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: [] }),
          }),
          order: () => Promise.resolve({ data: [] }),
        }),
      }),
    }));
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('does not auto-save when description emission equals persisted content', async () => {
    render(IssueSheet, {
      props: {
        open: true,
        mode: 'edit',
        issue: makeIssue({ description: '<p>same content</p>' }),
        epics: mockEpics,
        milestones: [],
        projectIssues: [],
        projects: [{ id: 'project-1', name: 'Project One' }],
        userId: 'user-1',
      },
    });

    await fireEvent.click(screen.getByTestId('emit-description-same'));
    await vi.advanceTimersByTimeAsync(1100);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('cancels stale debounced description save when switching issues', async () => {
    const issueA = makeIssue({
      id: 'issue-a',
      number: 1,
      title: 'Issue A',
      description: '<p>description a</p>',
    });

    const issueB = makeIssue({
      id: 'issue-b',
      number: 2,
      title: 'Issue B',
      description: '<p>description b</p>',
    });

    const { rerender } = render(IssueSheet, {
      props: {
        open: true,
        mode: 'edit',
        issue: issueA,
        epics: mockEpics,
        milestones: [],
        projectIssues: [],
        projects: [{ id: 'project-1', name: 'Project One' }],
        userId: 'user-1',
      },
    });

    await fireEvent.click(screen.getByTestId('emit-description-updated'));
    await vi.advanceTimersByTimeAsync(500);

    await rerender({
      open: true,
      mode: 'edit',
      issue: issueB,
      epics: mockEpics,
      milestones: [],
      projectIssues: [],
      projects: [{ id: 'project-1', name: 'Project One' }],
      userId: 'user-1',
    });

    await vi.advanceTimersByTimeAsync(700);

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
