import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { toastSuccessMock, toastErrorMock } = vi.hoisted(() => ({
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

import ProjectDetailSheet from '$lib/components/ProjectDetailSheet.svelte';
import { supabase } from '$lib/supabase';

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
  goto: vi.fn().mockResolvedValue(undefined),
}));

describe('ProjectDetailSheet create-to-edit transition', () => {
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
          project: {
            id: 'new-project-1',
            user_id: 'user-1',
            number: 7,
            name: 'New Project',
            description: null,
            created_at: new Date().toISOString(),
            archived_at: null,
          },
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(ProjectDetailSheet, {
      props: {
        open: true,
        mode: 'create',
        project: null,
        counts: null,
        metrics: null,
        epics: [],
        userId: 'user-1',
      },
    });

    // Should show create mode UI
    expect(screen.getByText('New Project')).toBeInTheDocument();
    expect(screen.getByText('Create Project')).toBeInTheDocument();

    // Fill in name
    const nameInput = screen.getByPlaceholderText('Project name');
    await fireEvent.input(nameInput, { target: { value: 'New Project' } });

    // Submit
    const submitButton = screen.getByText('Create Project');
    await fireEvent.click(submitButton);

    // Flush pending promises/timers so async handlers complete
    await vi.runAllTimersAsync();

    // Wait for transition
    await waitFor(() => {
      expect(screen.queryByText('Create Project')).not.toBeInTheDocument();
      expect(screen.getByText('P-7 · Project')).toBeInTheDocument();
    });

    expect(toastSuccessMock).toHaveBeenCalledWith('Project created', expect.any(Object));
  });

  it('stays in create mode on failed creation', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        type: 'error',
        data: { error: 'Name already exists' },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(ProjectDetailSheet, {
      props: {
        open: true,
        mode: 'create',
        project: null,
        counts: null,
        metrics: null,
        epics: [],
        userId: 'user-1',
      },
    });

    const nameInput = screen.getByPlaceholderText('Project name');
    await fireEvent.input(nameInput, { target: { value: 'Existing Project' } });

    const submitButton = screen.getByText('Create Project');
    await fireEvent.click(submitButton);

    // Flush pending promises/timers so async handlers complete
    await vi.runAllTimersAsync();

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith('Name already exists', expect.any(Object));
    });

    // Should still be in create mode
    expect(screen.getByText('New Project')).toBeInTheDocument();
    expect(screen.getByText('Create Project')).toBeInTheDocument();
  });
});
