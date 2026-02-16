import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';

import TreeToolbar from './TreeToolbar.svelte';

describe('TreeToolbar', () => {
  it('should render edit mode label and switch', () => {
    render(TreeToolbar, {
      props: {
        editMode: false,
        selectedCount: 0,
        breadcrumb: '',
        onEditModeChange: () => {},
        onBulkAction: () => {},
      },
    });

    // Check for label
    expect(screen.getByText('Edit mode')).toBeInTheDocument();

    // Check for switch button (Switch renders as a button with role="switch")
    const switchElement = screen.getByRole('switch');
    expect(switchElement).toBeInTheDocument();
    expect(switchElement).toHaveAttribute('aria-checked', 'false');
  });

  it('should show breadcrumb when provided', () => {
    const breadcrumb = 'P-1 Personal Tasks / E-3 Backend';

    render(TreeToolbar, {
      props: {
        editMode: false,
        selectedCount: 0,
        breadcrumb,
        onEditModeChange: () => {},
        onBulkAction: () => {},
      },
    });

    expect(screen.getByText(breadcrumb)).toBeInTheDocument();
  });

  it('should not show breadcrumb when empty string', () => {
    render(TreeToolbar, {
      props: {
        editMode: false,
        selectedCount: 0,
        breadcrumb: '',
        onEditModeChange: () => {},
        onBulkAction: () => {},
      },
    });

    // Should not find any breadcrumb text
    expect(screen.queryByText(/P-\d+/)).not.toBeInTheDocument();
  });

  it('should apply muted styling to breadcrumb', () => {
    const breadcrumb = 'P-1 Personal Tasks';

    render(TreeToolbar, {
      props: {
        editMode: false,
        selectedCount: 0,
        breadcrumb,
        onEditModeChange: () => {},
        onBulkAction: () => {},
      },
    });

    const breadcrumbElement = screen.getByText(breadcrumb);
    expect(breadcrumbElement).toHaveClass('text-muted-foreground');
  });

  it('should position breadcrumb on left and edit toggle on right', () => {
    const breadcrumb = 'P-1 Personal Tasks';

    render(TreeToolbar, {
      props: {
        editMode: false,
        selectedCount: 0,
        breadcrumb,
        onEditModeChange: () => {},
        onBulkAction: () => {},
      },
    });

    // Verify breadcrumb is displayed
    expect(screen.getByText(breadcrumb)).toBeInTheDocument();

    // Verify edit mode label and switch are displayed
    expect(screen.getByText('Edit mode')).toBeInTheDocument();
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('should toggle switch state when editMode prop changes', () => {
    const { rerender } = render(TreeToolbar, {
      props: {
        editMode: false,
        selectedCount: 0,
        breadcrumb: '',
        onEditModeChange: () => {},
        onBulkAction: () => {},
      },
    });

    const switchElement = screen.getByRole('switch');
    expect(switchElement).toHaveAttribute('aria-checked', 'false');

    // Update editMode prop
    rerender({
      editMode: true,
      selectedCount: 0,
      breadcrumb: '',
      onEditModeChange: () => {},
      onBulkAction: () => {},
    });

    expect(switchElement).toHaveAttribute('aria-checked', 'true');
  });
});
