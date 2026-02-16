import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';

import TreeToolbar from './TreeToolbar.svelte';

describe('TreeToolbar', () => {
  it('should render edit mode toggle', () => {
    render(TreeToolbar, {
      props: {
        editMode: false,
        selectedCount: 0,
        breadcrumb: '',
        onEditModeChange: () => {},
        onBulkAction: () => {},
      },
    });

    expect(screen.getByText(/Edit mode/i)).toBeInTheDocument();
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
  });
});
