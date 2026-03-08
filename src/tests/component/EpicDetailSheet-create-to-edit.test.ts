import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { toastSuccessMock, toastErrorMock } = vi.hoisted(() => ({
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

import EpicDetailSheet from '$lib/components/EpicDetailSheet.svelte';
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
}));

vi.mock('$app/forms', () => ({
  deserialize: (text: string) => JSON.parse(text),
}));

describe('EpicDetailSheet create-to-edit transition', () => {
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
      text: async () =>
        JSON.stringify({
          type: 'success',
          data: {
            epic: {
              id: 'new-epic-1',
              project_id: 'project-1',
              number: 5,
              name: 'New Epic',
              description: null,
              status: 'active',
              priority: null,
              is_default: false,
              sort_order: 0,
              milestone_id: null,
            },
          },
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(EpicDetailSheet, {
      props: {
        open: true,
        mode: 'create',
        epic: null,
        projectId: 'project-1',
        counts: null,
        userId: 'user-1',
        milestones: [],
      },
    });

    // Should show create mode UI
    expect(screen.getByText('New Epic')).toBeInTheDocument();
    expect(screen.getByText('Create Epic')).toBeInTheDocument();

    // Fill in name
    const nameInput = screen.getByPlaceholderText('Epic name');
    await fireEvent.input(nameInput, { target: { value: 'New Epic' } });

    // Submit
    const submitButton = screen.getByText('Create Epic');
    await fireEvent.click(submitButton);

    // Flush pending promises/timers so async handlers complete
    await vi.runAllTimersAsync();

    // Wait for transition
    await waitFor(() => {
      expect(screen.queryByText('Create Epic')).not.toBeInTheDocument();
      expect(screen.getByText('E-5')).toBeInTheDocument();
      expect(screen.getByText('New Epic')).toBeInTheDocument();
    });

    expect(toastSuccessMock).toHaveBeenCalledWith('Epic created', expect.any(Object));
  });

  it('stays in create mode on failed creation', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      text: async () =>
        JSON.stringify({
          type: 'failure',
          status: 400,
          data: { error: 'Epic name required' },
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(EpicDetailSheet, {
      props: {
        open: true,
        mode: 'create',
        epic: null,
        projectId: 'project-1',
        counts: null,
        userId: 'user-1',
        milestones: [],
      },
    });

    const nameInput = screen.getByPlaceholderText('Epic name');
    await fireEvent.input(nameInput, { target: { value: 'Failing Epic' } });

    const submitButton = screen.getByText('Create Epic');
    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith('Epic name required', expect.any(Object));
    });

    // Should still be in create mode
    expect(screen.getByText('New Epic')).toBeInTheDocument();
    expect(screen.getByText('Create Epic')).toBeInTheDocument();
  });
});
