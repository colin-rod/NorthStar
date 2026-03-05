import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

const { toastSuccessMock, toastErrorMock } = vi.hoisted(() => ({
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

import IssueSheet from '$lib/components/IssueSheet.svelte';
import { supabase } from '$lib/supabase';
import type { Epic, Issue } from '$lib/types';

vi.mock('$lib/components/ui/sheet', async () => {
  const mod = await import('./mocks/EmptyComponent.mock.svelte');
  return {
    Sheet: mod.default,
    SheetContent: mod.default,
    SheetHeader: mod.default,
    SheetTitle: mod.default,
  };
});

vi.mock('svelte-sonner', () => ({
  toast: {
    success: toastSuccessMock,
    error: toastErrorMock,
  },
}));

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

vi.mock('$app/forms', () => ({
  deserialize: (text: string) => JSON.parse(text),
}));

function makeIssue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: 'issue-1',
    project_id: 'project-1',
    epic_id: 'epic-1',
    number: 1,
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
    toastSuccessMock.mockClear();
    toastErrorMock.mockClear();

    fetchMock.mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ type: 'success' }),
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

  it('shows inline save-state text while saving and after successful completion', async () => {
    let resolveFetch: ((value: { ok: boolean; text: () => Promise<string> }) => void) | null = null;

    fetchMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );

    render(IssueSheet, {
      props: {
        open: true,
        mode: 'edit',
        issue: makeIssue(),
        epics: mockEpics,
        milestones: [],
        projectIssues: [],
        projects: [{ id: 'project-1', name: 'Project One' }],
        userId: 'user-1',
      },
    });

    const titleInput = screen.getByLabelText('Title');
    await fireEvent.input(titleInput, { target: { value: 'Issue One Updated' } });
    await fireEvent.blur(titleInput);

    expect(await screen.findByText('Saving')).toBeInTheDocument();

    resolveFetch!({ ok: true, text: async () => JSON.stringify({ type: 'success' }) });

    await waitFor(() => {
      expect(screen.getByText('Saved')).toBeInTheDocument();
    });

    await vi.advanceTimersByTimeAsync(1500);

    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  });

  it('passes polite status semantics to success toasts', async () => {
    render(IssueSheet, {
      props: {
        open: true,
        mode: 'edit',
        issue: makeIssue(),
        epics: mockEpics,
        milestones: [],
        projectIssues: [],
        projects: [{ id: 'project-1', name: 'Project One' }],
        userId: 'user-1',
      },
    });

    const titleInput = screen.getByLabelText('Title');
    await fireEvent.input(titleInput, { target: { value: 'Issue One Updated Again' } });
    await fireEvent.blur(titleInput);

    await waitFor(() => {
      expect(toastSuccessMock).toHaveBeenCalledWith(
        'Changes saved successfully',
        expect.objectContaining({
          role: 'status',
          'aria-live': 'polite',
        }),
      );
    });
  });

  it('passes assertive alert semantics to error toasts', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      text: async () =>
        JSON.stringify({ type: 'failure', status: 400, data: { error: 'Validation failed' } }),
    });

    render(IssueSheet, {
      props: {
        open: true,
        mode: 'edit',
        issue: makeIssue(),
        epics: mockEpics,
        milestones: [],
        projectIssues: [],
        projects: [{ id: 'project-1', name: 'Project One' }],
        userId: 'user-1',
      },
    });

    const titleInput = screen.getByLabelText('Title');
    await fireEvent.input(titleInput, { target: { value: 'Issue One Error Path' } });
    await fireEvent.blur(titleInput);

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        'Validation failed',
        expect.objectContaining({
          role: 'alert',
          'aria-live': 'assertive',
        }),
      );
    });
  });

  it('shows inline error state when save fails', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      text: async () =>
        JSON.stringify({ type: 'failure', status: 400, data: { error: 'Failed to save' } }),
    });

    render(IssueSheet, {
      props: {
        open: true,
        mode: 'edit',
        issue: makeIssue(),
        epics: mockEpics,
        milestones: [],
        projectIssues: [],
        projects: [{ id: 'project-1', name: 'Project One' }],
        userId: 'user-1',
      },
    });

    const titleInput = screen.getByLabelText('Title');
    await fireEvent.input(titleInput, { target: { value: 'Issue One Failed Save' } });
    await fireEvent.blur(titleInput);

    expect(await screen.findByText('Save failed')).toBeInTheDocument();
  });
});
