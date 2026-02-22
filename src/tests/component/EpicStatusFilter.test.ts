// tests/component/EpicStatusFilter.test.ts
import { render, screen } from '@testing-library/svelte';
import { writable } from 'svelte/store';
import { describe, it, expect, vi } from 'vitest';

import EpicStatusFilter from '$lib/components/EpicStatusFilter.svelte';

vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
}));

vi.mock('$app/stores', () => ({
  page: writable({
    url: new URL('http://localhost:5173/projects'),
  }),
}));

describe('EpicStatusFilter', () => {
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
});
