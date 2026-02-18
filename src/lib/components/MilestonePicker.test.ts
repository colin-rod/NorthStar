/**
 * Component Tests: MilestonePicker
 *
 * Tests for MilestonePicker component with popover UI.
 * Following TDD Red-Green-Refactor cycle.
 */

import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';

import MilestonePicker from './MilestonePicker.svelte';

import type { Milestone } from '$lib/types';

const mockMilestones: Milestone[] = [
  {
    id: 'milestone-1',
    user_id: 'user-1',
    name: 'Q1 2026 Launch',
    due_date: '2026-03-31',
  },
  {
    id: 'milestone-2',
    user_id: 'user-1',
    name: 'Q2 Release',
    due_date: '2026-06-30',
  },
  {
    id: 'milestone-3',
    user_id: 'user-1',
    name: 'Sprint 23',
    due_date: null,
  },
];

describe('MilestonePicker', () => {
  it('should display "No milestone" when selectedMilestoneId is null', () => {
    const mockOnChange = vi.fn();

    render(MilestonePicker, {
      props: {
        selectedMilestoneId: null,
        milestones: mockMilestones,
        disabled: false,
        onChange: mockOnChange,
      },
    });

    const trigger = screen.getByText(/no milestone/i);
    expect(trigger).toBeInTheDocument();
  });

  it('should display selected milestone name when milestone is selected', () => {
    const mockOnChange = vi.fn();

    render(MilestonePicker, {
      props: {
        selectedMilestoneId: 'milestone-1',
        milestones: mockMilestones,
        disabled: false,
        onChange: mockOnChange,
      },
    });

    const trigger = screen.getByText(/Q1 2026 Launch/i);
    expect(trigger).toBeInTheDocument();
  });

  it('should display due date alongside selected milestone name', () => {
    const mockOnChange = vi.fn();

    render(MilestonePicker, {
      props: {
        selectedMilestoneId: 'milestone-1',
        milestones: mockMilestones,
        disabled: false,
        onChange: mockOnChange,
      },
    });

    // Should show both name and formatted due date
    expect(screen.getByText(/Q1 2026 Launch/i)).toBeInTheDocument();
    expect(screen.getByText(/Mar 31, 2026/i)).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    const mockOnChange = vi.fn();

    render(MilestonePicker, {
      props: {
        selectedMilestoneId: null,
        milestones: mockMilestones,
        disabled: true,
        onChange: mockOnChange,
      },
    });

    const trigger = screen.getByRole('button');
    expect(trigger).toBeDisabled();
  });

  it('should call onChange when a milestone is selected from the list', async () => {
    const mockOnChange = vi.fn();

    render(MilestonePicker, {
      props: {
        selectedMilestoneId: null,
        milestones: mockMilestones,
        disabled: false,
        onChange: mockOnChange,
      },
    });

    // Open popover
    const trigger = screen.getByRole('button');
    await fireEvent.click(trigger);

    // Select a milestone from the list
    const milestoneOption = screen.getByText(/Q2 Release/i);
    await fireEvent.click(milestoneOption);

    // Should call onChange with the milestone ID
    expect(mockOnChange).toHaveBeenCalledWith('milestone-2');
  });

  it('should display selected milestone without due date (no date shown)', () => {
    const mockOnChange = vi.fn();

    render(MilestonePicker, {
      props: {
        selectedMilestoneId: 'milestone-3',
        milestones: mockMilestones,
        disabled: false,
        onChange: mockOnChange,
      },
    });

    // milestone-3 is "Sprint 23" with due_date: null
    expect(screen.getByText(/Sprint 23/i)).toBeInTheDocument();
    // Should NOT show any date text for this milestone
    expect(screen.queryByText(/2026/)).not.toBeInTheDocument();
  });

  it('should not show progress bar when milestone has zero issues', async () => {
    const mockOnChange = vi.fn();

    render(MilestonePicker, {
      props: {
        selectedMilestoneId: null,
        milestones: mockMilestones,
        issues: [], // No issues assigned to any milestone
        disabled: false,
        onChange: mockOnChange,
      },
    });

    // Open popover
    const trigger = screen.getByRole('button');
    await fireEvent.click(trigger);

    // Milestones should render but without progress bars (no "0/0" text)
    expect(screen.getByText(/Q1 2026 Launch/i)).toBeInTheDocument();
    expect(screen.queryByText(/\/0/)).not.toBeInTheDocument();
  });

  it('should show progress bar when milestone has issues assigned', async () => {
    const mockOnChange = vi.fn();

    const mockIssues = [
      {
        id: 'issue-1',
        number: 1,
        project_id: 'project-1',
        epic_id: 'epic-1',
        parent_issue_id: null,
        milestone_id: 'milestone-1',
        title: 'Done issue',
        status: 'done' as const,
        priority: 1,
        story_points: null,
        sort_order: null,
        created_at: '2024-01-01T00:00:00Z',
        description: null,
      },
      {
        id: 'issue-2',
        number: 2,
        project_id: 'project-1',
        epic_id: 'epic-1',
        parent_issue_id: null,
        milestone_id: 'milestone-1',
        title: 'Todo issue',
        status: 'todo' as const,
        priority: 1,
        story_points: null,
        sort_order: null,
        created_at: '2024-01-01T00:00:00Z',
        description: null,
      },
    ];

    render(MilestonePicker, {
      props: {
        selectedMilestoneId: null,
        milestones: mockMilestones,
        issues: mockIssues,
        disabled: false,
        onChange: mockOnChange,
      },
    });

    // Open popover
    const trigger = screen.getByRole('button');
    await fireEvent.click(trigger);

    // Progress bar shows "completed/total" — 1 done out of 2 total for milestone-1
    expect(screen.getByText('1/2')).toBeInTheDocument();
  });

  it('should call onChange with null when "No milestone" is selected', async () => {
    const mockOnChange = vi.fn();

    render(MilestonePicker, {
      props: {
        selectedMilestoneId: 'milestone-1',
        milestones: mockMilestones,
        disabled: false,
        onChange: mockOnChange,
      },
    });

    // Open popover
    const trigger = screen.getByRole('button');
    await fireEvent.click(trigger);

    // Select "No milestone" option
    const noMilestoneOption = screen.getByText(/clear milestone/i);
    await fireEvent.click(noMilestoneOption);

    // Should call onChange with null
    expect(mockOnChange).toHaveBeenCalledWith(null);
  });
});
