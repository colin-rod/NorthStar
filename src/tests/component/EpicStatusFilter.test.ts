// tests/component/EpicStatusFilter.test.ts
import { render, screen, fireEvent } from '@testing-library/svelte';
import { writable } from 'svelte/store';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { goto } from '$app/navigation';
import EpicStatusFilter from '$lib/components/EpicStatusFilter.svelte';

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

describe('EpicStatusFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPageStore = writable({
      url: new URL('http://localhost:5173/projects'),
    });
  });

  it('should render with default text', () => {
    render(EpicStatusFilter, {
      props: {
        selectedStatuses: [],
      },
    });

    expect(screen.getByText('Epic Status')).toBeInTheDocument();
  });

  it('should show count when statuses selected', () => {
    render(EpicStatusFilter, {
      props: {
        selectedStatuses: ['active'],
      },
    });

    expect(screen.getByText('Epic Status (1)')).toBeInTheDocument();
  });

  it('should display options in popover', async () => {
    render(EpicStatusFilter, {
      props: { selectedStatuses: [] },
    });

    const trigger = screen.getByText('Epic Status');
    await fireEvent.click(trigger);

    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.getByText('Canceled')).toBeInTheDocument();
  });

  it('should call goto when status is toggled', async () => {
    render(EpicStatusFilter, {
      props: { selectedStatuses: [] },
    });

    const trigger = screen.getByText('Epic Status');
    await fireEvent.click(trigger);

    const activeOption = screen.getByText('Active');
    await fireEvent.click(activeOption);

    expect(mockGoto).toHaveBeenCalledWith(
      expect.stringContaining('epic_status=active'),
      expect.objectContaining({ replaceState: false, noScroll: true }),
    );
  });

  it('should remove status from URL when deselecting', async () => {
    render(EpicStatusFilter, {
      props: { selectedStatuses: ['active'] },
    });

    const trigger = screen.getByText('Epic Status (1)');
    await fireEvent.click(trigger);

    const activeOption = screen.getByText('Active');
    await fireEvent.click(activeOption);

    expect(mockGoto).toHaveBeenCalled();
    const calledUrl = mockGoto.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain('epic_status=');
  });
});
