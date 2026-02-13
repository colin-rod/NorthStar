/**
 * Component Tests: MilestoneForm
 *
 * Tests for MilestoneForm component in both create and edit modes.
 * Following TDD Red-Green-Refactor cycle.
 */

import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';

import MilestoneForm from './MilestoneForm.svelte';

import type { Milestone } from '$lib/types';

describe('MilestoneForm - Create Mode', () => {
  it('should render name input field', () => {
    const mockOnSuccess = vi.fn();
    const mockOnCancel = vi.fn();

    render(MilestoneForm, {
      props: {
        mode: 'create',
        onSuccess: mockOnSuccess,
        onCancel: mockOnCancel,
      },
    });

    const nameInput = screen.getByLabelText(/name/i);
    expect(nameInput).toBeInTheDocument();
  });

  it('should render due date input field', () => {
    const mockOnSuccess = vi.fn();
    const mockOnCancel = vi.fn();

    render(MilestoneForm, {
      props: {
        mode: 'create',
        onSuccess: mockOnSuccess,
        onCancel: mockOnCancel,
      },
    });

    const dueDateInput = screen.getByLabelText(/due date/i);
    expect(dueDateInput).toBeInTheDocument();
    expect(dueDateInput).toHaveAttribute('type', 'date');
  });

  it('should render Create button in create mode', () => {
    const mockOnSuccess = vi.fn();
    const mockOnCancel = vi.fn();

    render(MilestoneForm, {
      props: {
        mode: 'create',
        onSuccess: mockOnSuccess,
        onCancel: mockOnCancel,
      },
    });

    const createButton = screen.getByRole('button', { name: /create/i });
    expect(createButton).toBeInTheDocument();
  });

  it('should render Cancel button', () => {
    const mockOnSuccess = vi.fn();
    const mockOnCancel = vi.fn();

    render(MilestoneForm, {
      props: {
        mode: 'create',
        onSuccess: mockOnSuccess,
        onCancel: mockOnCancel,
      },
    });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeInTheDocument();
  });

  it('should call onCancel when Cancel button is clicked', async () => {
    const mockOnSuccess = vi.fn();
    const mockOnCancel = vi.fn();

    render(MilestoneForm, {
      props: {
        mode: 'create',
        onSuccess: mockOnSuccess,
        onCancel: mockOnCancel,
      },
    });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when Escape key is pressed', async () => {
    const mockOnSuccess = vi.fn();
    const mockOnCancel = vi.fn();

    render(MilestoneForm, {
      props: {
        mode: 'create',
        onSuccess: mockOnSuccess,
        onCancel: mockOnCancel,
      },
    });

    const nameInput = screen.getByLabelText(/name/i);
    await fireEvent.keyDown(nameInput, { key: 'Escape' });

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });
});

describe('MilestoneForm - Edit Mode', () => {
  const testMilestone: Milestone = {
    id: 'milestone-1',
    user_id: 'user-1',
    name: 'Q1 2026 Launch',
    due_date: '2026-03-31',
  };

  it('should pre-populate name field with milestone name', () => {
    const mockOnSuccess = vi.fn();
    const mockOnCancel = vi.fn();

    render(MilestoneForm, {
      props: {
        mode: 'edit',
        milestone: testMilestone,
        onSuccess: mockOnSuccess,
        onCancel: mockOnCancel,
      },
    });

    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
    expect(nameInput.value).toBe('Q1 2026 Launch');
  });

  it('should pre-populate due_date field with milestone due_date', () => {
    const mockOnSuccess = vi.fn();
    const mockOnCancel = vi.fn();

    render(MilestoneForm, {
      props: {
        mode: 'edit',
        milestone: testMilestone,
        onSuccess: mockOnSuccess,
        onCancel: mockOnCancel,
      },
    });

    const dueDateInput = screen.getByLabelText(/due date/i) as HTMLInputElement;
    expect(dueDateInput.value).toBe('2026-03-31');
  });

  it('should render Save button in edit mode', () => {
    const mockOnSuccess = vi.fn();
    const mockOnCancel = vi.fn();

    render(MilestoneForm, {
      props: {
        mode: 'edit',
        milestone: testMilestone,
        onSuccess: mockOnSuccess,
        onCancel: mockOnCancel,
      },
    });

    const saveButton = screen.getByRole('button', { name: /save/i });
    expect(saveButton).toBeInTheDocument();
  });

  it('should handle milestone without due_date', () => {
    const milestoneWithoutDate: Milestone = {
      ...testMilestone,
      due_date: null,
    };

    const mockOnSuccess = vi.fn();
    const mockOnCancel = vi.fn();

    render(MilestoneForm, {
      props: {
        mode: 'edit',
        milestone: milestoneWithoutDate,
        onSuccess: mockOnSuccess,
        onCancel: mockOnCancel,
      },
    });

    const dueDateInput = screen.getByLabelText(/due date/i) as HTMLInputElement;
    expect(dueDateInput.value).toBe('');
  });
});
