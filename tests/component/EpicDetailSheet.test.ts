/**
 * TDD Tests for EpicDetailSheet component
 * RED phase: These tests will fail until the component is implemented
 */
import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';

import EpicDetailSheet from '$lib/components/EpicDetailSheet.svelte';
import type { Epic } from '$lib/types';
import type { IssueCounts } from '$lib/utils/issue-counts';

const mockEpic: Epic = {
  id: 'e1',
  project_id: 'p1',
  number: 1,
  name: 'Test Epic',
  status: 'active',
  is_default: false,
  sort_order: 0,
};

const mockCounts: IssueCounts = {
  ready: 2,
  blocked: 1,
  doing: 1,
  inReview: 0,
  done: 3,
  canceled: 0,
};

describe('EpicDetailSheet', () => {
  it('does not render content when open is false', () => {
    render(EpicDetailSheet, {
      props: { open: false, epic: mockEpic, counts: mockCounts },
    });
    expect(screen.queryByDisplayValue('Test Epic')).toBeNull();
  });

  it('renders epic name in an input when open', () => {
    render(EpicDetailSheet, {
      props: { open: true, epic: mockEpic, counts: mockCounts },
    });
    expect(screen.getByDisplayValue('Test Epic')).toBeTruthy();
  });

  it('renders status select with correct value when open', () => {
    render(EpicDetailSheet, {
      props: { open: true, epic: mockEpic, counts: mockCounts },
    });
    const select = screen.getByRole('combobox');
    expect((select as HTMLSelectElement).value).toBe('active');
  });

  it('renders all 6 count labels when open', () => {
    render(EpicDetailSheet, {
      props: { open: true, epic: mockEpic, counts: mockCounts },
    });
    expect(screen.getByText('Ready')).toBeTruthy();
    expect(screen.getByText('Doing')).toBeTruthy();
    expect(screen.getByText('In Review')).toBeTruthy();
    expect(screen.getByText('Blocked')).toBeTruthy();
    expect(screen.getByText('Done')).toBeTruthy();
    expect(screen.getByText('Canceled')).toBeTruthy();
  });

  it('renders done status in select correctly', () => {
    const doneEpic = { ...mockEpic, status: 'done' as const };
    render(EpicDetailSheet, {
      props: { open: true, epic: doneEpic, counts: mockCounts },
    });
    const select = screen.getByRole('combobox');
    expect((select as HTMLSelectElement).value).toBe('done');
  });
});
