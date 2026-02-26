import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { toastSuccessMock, toastErrorMock } = vi.hoisted(() => ({
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

import IssueSheet from '$lib/components/IssueSheet.svelte';
import { supabase } from '$lib/supabase';
import type { Epic } from '$lib/types';

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

vi.mock('$app/navigation', () => ({
  invalidateAll: vi.fn().mockResolvedValue(undefined),
}));

const mockEpics: Epic[] = [
  {
    id: 'epic-1',
    project_id: 'project-1',
    number: 1,
    name: 'Epic One',
    description: null,
    status: 'active',
    priority: null,
    is_default: true,
    sort_order: 0,
    milestone_id: null,
  },
];

const mockProjects = [{ id: 'project-1', name: 'Project One' }];

describe('IssueSheet create-to-edit transition', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    toastSuccessMock.mockClear();
    toastErrorMock.mockClear();

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

  it('transitions to edit mode after successful creation', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        type: 'success',
        data: {
          issue: {
            id: 'new-issue-1',
            project_id: 'project-1',
            epic_id: 'epic-1',
            number: 42,
            parent_issue_id: null,
            milestone_id: null,
            title: 'New Issue',
            description: null,
            status: 'todo',
            priority: 2,
            story_points: null,
            sort_order: 0,
            created_at: new Date().toISOString(),
          },
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(IssueSheet, {
      props: {
        open: true,
        mode: 'create',
        issue: null,
        epics: mockEpics,
        milestones: [],
        projectIssues: [],
        projects: mockProjects,
        userId: 'user-1',
      },
    });

    // Should show create mode UI
    expect(screen.getByText('New Issue')).toBeInTheDocument();
    expect(screen.getByText('Create Issue')).toBeInTheDocument();

    // Fill in title
    const titleInput = screen.getByPlaceholderText('What needs to be done?');
    await fireEvent.input(titleInput, { target: { value: 'New Issue' } });

    // Submit
    const submitButton = screen.getByText('Create Issue');
    await fireEvent.click(submitButton);

    // Wait for transition
    await waitFor(() => {
      // Should show edit mode indicators
      expect(screen.queryByText('Create Issue')).not.toBeInTheDocument();
      // Should show the issue number from the response
      expect(screen.getByText('I-42')).toBeInTheDocument();
    });

    // Should show success toast
    expect(toastSuccessMock).toHaveBeenCalledWith('Issue created', expect.any(Object));
  });

  it('shows error toast on failed creation without transitioning', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        type: 'error',
        data: { error: 'Title too long' },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(IssueSheet, {
      props: {
        open: true,
        mode: 'create',
        issue: null,
        epics: mockEpics,
        milestones: [],
        projectIssues: [],
        projects: mockProjects,
        userId: 'user-1',
      },
    });

    const titleInput = screen.getByPlaceholderText('What needs to be done?');
    await fireEvent.input(titleInput, { target: { value: 'Failing Issue' } });

    const submitButton = screen.getByText('Create Issue');
    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith('Title too long', expect.any(Object));
    });

    // Should still be in create mode
    expect(screen.getByText('New Issue')).toBeInTheDocument();
    expect(screen.getByText('Create Issue')).toBeInTheDocument();
  });
});
