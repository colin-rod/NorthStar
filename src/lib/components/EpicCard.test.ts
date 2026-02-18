import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';

import EpicCard from './EpicCard.svelte';

import type { Epic } from '$lib/types';
import type { IssueCounts } from '$lib/utils/issue-counts';

describe('EpicCard', () => {
  const mockEpic: Epic = {
    id: 'epic1',
    project_id: 'project1',
    number: 1,
    name: 'Test Epic',
    status: 'active',
    is_default: false,
    sort_order: 0,
    description: null,
    priority: null,
  };

  const mockCounts: IssueCounts = {
    ready: 3,
    blocked: 1,
    doing: 2,
    inReview: 1,
    done: 5,
    canceled: 0,
  };

  describe('Priority and milestone badges', () => {
    it('should render priority badge in navigation mode when priority is set', () => {
      render(EpicCard, {
        props: {
          epic: { ...mockEpic, priority: 0 },
          counts: mockCounts,
        },
      });
      expect(screen.getByText('P0')).toBeTruthy();
    });

    it('should render milestone badge in navigation mode when milestone is set', () => {
      render(EpicCard, {
        props: {
          epic: {
            ...mockEpic,
            milestone: { id: 'm1', name: 'v1.0', user_id: 'u1', due_date: null },
          },
          counts: mockCounts,
        },
      });
      expect(screen.getByText('v1.0')).toBeTruthy();
    });

    it('should render priority badge in drill-down mode when priority is set', () => {
      render(EpicCard, {
        props: {
          epic: { ...mockEpic, priority: 2 },
          counts: mockCounts,
          onToggle: () => {},
        },
      });
      expect(screen.getByText('P2')).toBeTruthy();
    });

    it('should render milestone badge in drill-down mode when milestone is set', () => {
      render(EpicCard, {
        props: {
          epic: {
            ...mockEpic,
            milestone: { id: 'm1', name: 'Q1 Release', user_id: 'u1', due_date: null },
          },
          counts: mockCounts,
          onToggle: () => {},
        },
      });
      expect(screen.getByText('Q1 Release')).toBeTruthy();
    });
  });

  describe('Navigation mode (without onToggle)', () => {
    it('should render as link when onToggle is undefined', () => {
      const { container } = render(EpicCard, {
        props: {
          epic: mockEpic,
          counts: mockCounts,
        },
      });

      // Should render as link (anchor tag)
      const link = container.querySelector('a');
      expect(link).toBeTruthy();
    });

    it('should display epic name', () => {
      render(EpicCard, {
        props: {
          epic: mockEpic,
          counts: mockCounts,
        },
      });

      expect(screen.getByText('Test Epic')).toBeTruthy();
    });

    it('should display status badge', () => {
      render(EpicCard, {
        props: {
          epic: mockEpic,
          counts: mockCounts,
        },
      });

      expect(screen.getByText('active')).toBeTruthy();
    });

    it('should display issue counts', () => {
      render(EpicCard, {
        props: {
          epic: mockEpic,
          counts: mockCounts,
        },
      });

      // Check for count labels instead of just numbers to avoid ambiguity
      expect(screen.getByText('Ready')).toBeTruthy();
      expect(screen.getByText('Blocked')).toBeTruthy();
      expect(screen.getByText('Doing')).toBeTruthy();
      expect(screen.getByText('In Review')).toBeTruthy();
      expect(screen.getByText('Done')).toBeTruthy();
      expect(screen.getByText('Canceled')).toBeTruthy();
    });
  });

  describe('Drill-down mode (with onToggle)', () => {
    it('should render as button when onToggle is provided', () => {
      const onToggle = () => {};
      const { container } = render(EpicCard, {
        props: {
          epic: mockEpic,
          counts: mockCounts,
          onToggle,
        },
      });

      // Should render as button
      const button = container.querySelector('button');
      expect(button).toBeTruthy();
    });

    it('should show summary pill with completed/total when there are issues', () => {
      const onToggle = () => {};
      render(EpicCard, {
        props: {
          epic: mockEpic,
          counts: mockCounts, // total=12, completed(done+canceled)=5+0=5
          onToggle,
        },
      });

      // Summary pill shows completed/total (5 done + 0 canceled = 5 completed out of 12 total)
      expect(screen.getByText('5/12')).toBeTruthy();
    });
  });

  describe('Status variants', () => {
    it('should show done status variant', () => {
      const doneEpic: Epic = {
        ...mockEpic,
        status: 'done',
      };

      render(EpicCard, {
        props: {
          epic: doneEpic,
          counts: mockCounts,
        },
      });

      expect(screen.getByText('done')).toBeTruthy();
    });

    it('should show canceled status variant', () => {
      const canceledEpic: Epic = {
        ...mockEpic,
        status: 'canceled',
      };

      render(EpicCard, {
        props: {
          epic: canceledEpic,
          counts: mockCounts,
        },
      });

      expect(screen.getByText('canceled')).toBeTruthy();
    });
  });

  describe('Progress bar', () => {
    it('should show progress bar when there are issues (drill-down mode)', () => {
      const onToggle = () => {};
      render(EpicCard, {
        props: {
          epic: mockEpic,
          counts: mockCounts,
          onToggle,
        },
      });

      // Check for progress percentage text
      const total = 3 + 1 + 2 + 1 + 5 + 0; // 12 issues
      const completed = 5 + 0; // done + canceled
      const percentage = Math.round((completed / total) * 100); // 42%

      expect(screen.getByText(`${percentage}%`)).toBeTruthy();
    });

    it('should show progress bar when there are issues (navigation mode)', () => {
      render(EpicCard, {
        props: {
          epic: mockEpic,
          counts: mockCounts,
        },
      });

      // Check for progress percentage text
      const total = 3 + 1 + 2 + 1 + 5 + 0; // 12 issues
      const completed = 5 + 0; // done + canceled
      const percentage = Math.round((completed / total) * 100); // 42%

      expect(screen.getByText(`${percentage}%`)).toBeTruthy();
    });

    it('should not show progress bar when there are no issues (drill-down mode)', () => {
      const onToggle = () => {};
      const emptyCounts: IssueCounts = {
        ready: 0,
        blocked: 0,
        doing: 0,
        inReview: 0,
        done: 0,
        canceled: 0,
      };

      render(EpicCard, {
        props: {
          epic: mockEpic,
          counts: emptyCounts,
          onToggle,
        },
      });

      // No percentage text should be shown
      expect(screen.queryByText(/%/)).toBeNull();
    });

    it('should not show progress bar when there are no issues (navigation mode)', () => {
      const emptyCounts: IssueCounts = {
        ready: 0,
        blocked: 0,
        doing: 0,
        inReview: 0,
        done: 0,
        canceled: 0,
      };

      render(EpicCard, {
        props: {
          epic: mockEpic,
          counts: emptyCounts,
        },
      });

      // No percentage text should be shown
      expect(screen.queryByText(/%/)).toBeNull();
    });
  });
});
