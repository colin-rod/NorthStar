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
