// src/tests/component/IssueGroupBySelector.test.ts
import { render, screen } from '@testing-library/svelte';
import { writable } from 'svelte/store';
import { describe, it, expect, vi } from 'vitest';

import IssueGroupBySelector from '$lib/components/IssueGroupBySelector.svelte';

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

describe('IssueGroupBySelector', () => {
  it('should render with default text when groupBy is "none"', () => {
    render(IssueGroupBySelector, {
      props: {
        selectedGroupBy: 'none',
      },
    });

    expect(screen.getByText('Group By: None')).toBeInTheDocument();
  });

  it('should render with selected group label', () => {
    render(IssueGroupBySelector, {
      props: {
        selectedGroupBy: 'priority',
      },
    });

    expect(screen.getByText('Group By: Priority')).toBeInTheDocument();
  });

  it('should render a button trigger', () => {
    const { container } = render(IssueGroupBySelector, {
      props: {
        selectedGroupBy: 'none',
      },
    });

    // Should render a button
    const trigger = container.querySelector('button');
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
  });

  it('should have proper button styling', () => {
    const { container } = render(IssueGroupBySelector, {
      props: {
        selectedGroupBy: 'priority',
      },
    });

    // Check for button with proper classes
    const trigger = container.querySelector('button');
    expect(trigger).toBeInTheDocument();
    expect(trigger?.className).toContain('border-input');
  });
});
