import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';

import TreeToolbar from './TreeToolbar.svelte';

describe('TreeToolbar', () => {
  it('should show breadcrumb when provided', () => {
    const breadcrumb = 'P-1 Personal Tasks / E-3 Backend';

    render(TreeToolbar, {
      props: {
        selectedCount: 0,
        breadcrumb,
        onBulkAction: () => {},
      },
    });

    expect(screen.getByText(breadcrumb)).toBeInTheDocument();
  });

  it('should not show breadcrumb when empty string', () => {
    render(TreeToolbar, {
      props: {
        selectedCount: 0,
        breadcrumb: '',
        onBulkAction: () => {},
      },
    });

    expect(screen.queryByText(/P-\d+/)).not.toBeInTheDocument();
  });

  it('should apply muted styling to breadcrumb', () => {
    const breadcrumb = 'P-1 Personal Tasks';

    render(TreeToolbar, {
      props: {
        selectedCount: 0,
        breadcrumb,
        onBulkAction: () => {},
      },
    });

    const breadcrumbElement = screen.getByText(breadcrumb);
    expect(breadcrumbElement).toHaveClass('text-muted-foreground');
  });

  it('should show selected count and delete button when items are selected', () => {
    render(TreeToolbar, {
      props: {
        selectedCount: 3,
        breadcrumb: '',
        onBulkAction: () => {},
      },
    });

    expect(screen.getByText('3 selected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('should call onBulkAction with delete when delete button is clicked', async () => {
    const onBulkAction = vi.fn();

    render(TreeToolbar, {
      props: {
        selectedCount: 2,
        breadcrumb: '',
        onBulkAction,
      },
    });

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await fireEvent.click(deleteButton);

    expect(onBulkAction).toHaveBeenCalledWith('delete');
  });
});
