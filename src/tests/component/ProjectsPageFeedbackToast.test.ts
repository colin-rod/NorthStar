import { fireEvent, render, screen } from '@testing-library/svelte';
import { writable } from 'svelte/store';
import { describe, expect, it, vi } from 'vitest';

import ProjectsPage from '../../routes/(protected)/projects/+page.svelte';

vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
  invalidateAll: vi.fn(() => Promise.resolve()),
}));

vi.mock('$app/stores', () => ({
  page: writable({
    url: new URL('http://localhost/projects'),
  }),
}));

vi.mock('$lib/components/tree-grid/TreeGrid.svelte', async () => {
  const mod = await import('./mocks/TreeGridToastTrigger.mock.svelte');
  return { default: mod.default };
});

vi.mock('$lib/components/ProjectDetailSheet.svelte', async () => {
  const mod = await import('./mocks/EmptyComponent.mock.svelte');
  return { default: mod.default };
});
vi.mock('$lib/components/EpicDetailSheet.svelte', async () => {
  const mod = await import('./mocks/EmptyComponent.mock.svelte');
  return { default: mod.default };
});
vi.mock('$lib/components/IssueSheet.svelte', async () => {
  const mod = await import('./mocks/EmptyComponent.mock.svelte');
  return { default: mod.default };
});
vi.mock('$lib/components/NewButtonDropdown.svelte', async () => {
  const mod = await import('./mocks/EmptyComponent.mock.svelte');
  return { default: mod.default };
});
vi.mock('$lib/components/FilterPanel.svelte', async () => {
  const mod = await import('./mocks/EmptyComponent.mock.svelte');
  return { default: mod.default };
});
vi.mock('$lib/components/IssueGroupBySelector.svelte', async () => {
  const mod = await import('./mocks/EmptyComponent.mock.svelte');
  return { default: mod.default };
});
vi.mock('$lib/components/IssueSortBySelector.svelte', async () => {
  const mod = await import('./mocks/EmptyComponent.mock.svelte');
  return { default: mod.default };
});
vi.mock('$lib/components/ContextMenu.svelte', async () => {
  const mod = await import('./mocks/EmptyComponent.mock.svelte');
  return { default: mod.default };
});
vi.mock('$lib/components/EmptyState.svelte', async () => {
  const mod = await import('./mocks/EmptyComponent.mock.svelte');
  return { default: mod.default };
});

const pageData = {
  projects: [
    {
      id: 'project-1',
      name: 'Project One',
      epics: [],
    },
  ],
  filterParams: {
    projectStatus: [],
    epicStatus: [],
    issuePriority: [],
    issueStatus: [],
    issueStoryPoints: [],
    groupBy: 'none',
  },
  milestones: [],
  session: { user: { id: 'user-1' } },
};

describe('Projects page inline feedback toast accessibility', () => {
  it('renders success feedback as polite status region', async () => {
    render(ProjectsPage, { props: { data: pageData } });

    await fireEvent.click(screen.getByRole('button', { name: 'Emit success' }));

    const toast = await screen.findByRole('status');
    expect(toast).toHaveAttribute('aria-live', 'polite');
    expect(toast).toHaveTextContent('Saved from grid');
    expect(toast).toHaveClass('bg-primary');
  });

  it('renders error feedback as assertive alert region', async () => {
    render(ProjectsPage, { props: { data: pageData } });

    await fireEvent.click(screen.getByRole('button', { name: 'Emit error' }));

    const toast = await screen.findByRole('alert');
    expect(toast).toHaveAttribute('aria-live', 'assertive');
    expect(toast).toHaveTextContent('Failed from grid');
    expect(toast).toHaveClass('bg-destructive');
  });
});
