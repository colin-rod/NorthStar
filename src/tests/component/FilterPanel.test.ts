// tests/component/FilterPanel.test.ts
import { render, screen } from '@testing-library/svelte';
import { writable } from 'svelte/store';
import { describe, it, expect, vi } from 'vitest';

import FilterPanel from '$lib/components/FilterPanel.svelte';

vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
}));

vi.mock('$app/stores', () => ({
  page: writable({
    url: new URL('http://localhost:5173/projects'),
  }),
}));

describe('FilterPanel', () => {
  const defaultProps = {
    filterParams: {
      projectStatus: [],
      epicStatus: [],
      issuePriority: [],
      issueStatus: [],
      issueStoryPoints: [],
      groupBy: 'none',
      sortBy: 'priority',
      sortDir: 'asc' as const,
    },
    open: true,
  };

  it('should render section headers', () => {
    render(FilterPanel, { props: defaultProps });

    expect(screen.getByText('Project Filters')).toBeInTheDocument();
    expect(screen.getByText('Epic Filters')).toBeInTheDocument();
    expect(screen.getByText('Issue Filters')).toBeInTheDocument();
  });

  it('should render Clear all filters button', () => {
    render(FilterPanel, { props: defaultProps });

    expect(screen.getByText('Clear all filters')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(FilterPanel, {
      props: { ...defaultProps, open: false },
    });

    expect(screen.queryByText('Project Filters')).not.toBeInTheDocument();
  });
});
