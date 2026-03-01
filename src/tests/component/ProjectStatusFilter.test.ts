// src/tests/component/ProjectStatusFilter.test.ts
import { render, screen } from '@testing-library/svelte';
import { writable } from 'svelte/store';
import { describe, it, expect, vi } from 'vitest';

import ProjectStatusFilter from '$lib/components/ProjectStatusFilter.svelte';

// Mock $app/navigation
vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
}));

// Mock $app/stores
vi.mock('$app/stores', () => ({
  page: writable({
    url: new URL('http://localhost:5173/projects'),
  }),
}));

describe('ProjectStatusFilter', () => {
  it('should render with default text when no selection', () => {
    render(ProjectStatusFilter, {
      props: {
        selectedStatuses: [],
      },
    });

    expect(screen.getByText('Project Status')).toBeInTheDocument();
  });

  it('should show count when statuses selected', () => {
    render(ProjectStatusFilter, {
      props: {
        selectedStatuses: ['active', 'done'],
      },
    });

    expect(screen.getByText('Project Status (2)')).toBeInTheDocument();
  });

  it('should display status options', async () => {
    const { container } = render(ProjectStatusFilter, {
      props: {
        selectedStatuses: [],
      },
    });

    // Click trigger to open popover
    const trigger = container.querySelector('button');
    await trigger?.click();

    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.getByText('Canceled')).toBeInTheDocument();
  });
});
