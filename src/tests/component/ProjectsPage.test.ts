import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { writable } from 'svelte/store';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const { toastSuccessMock, toastErrorMock } = vi.hoisted(() => ({
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

vi.mock('svelte-sonner', () => ({
  toast: {
    success: toastSuccessMock,
    error: toastErrorMock,
  },
}));

import type { PageData } from '../../routes/(protected)/projects/$types';
import ProjectsPage from '../../routes/(protected)/projects/+page.svelte';

import { goto, invalidateAll } from '$app/navigation';

// --- Mocks ---

vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
  invalidateAll: vi.fn(() => Promise.resolve()),
}));

vi.mock('$app/forms', () => ({
  deserialize: (text: string) => JSON.parse(text),
}));

let mockPageStore: ReturnType<typeof writable>;

vi.mock('$app/stores', () => ({
  get page() {
    return mockPageStore;
  },
}));

const mockGoto = vi.mocked(goto);
const mockInvalidateAll = vi.mocked(invalidateAll);

vi.mock('$lib/components/tree-grid/TreeGrid.svelte', async () => {
  const mod = await import('./mocks/TreeGridActionTrigger.mock.svelte');
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

// --- Shared test data ---

const baseProject = {
  id: 'project-1',
  number: 1,
  name: 'Project One',
  user_id: 'user-1',
  created_at: new Date().toISOString(),
  archived_at: null,
  color: null,
  icon: null,
  status: 'active',
  description: null,
  epics: [
    {
      id: 'epic-1',
      number: 1,
      name: 'Epic One',
      project_id: 'project-1',
      status: 'active',
      is_default: false,
      sort_order: null,
      description: null,
      priority: null,
      issues: [
        {
          id: 'issue-1',
          number: 1,
          title: 'Issue One',
          status: 'todo',
          priority: 0,
          project_id: 'project-1',
          epic_id: 'epic-1',
          milestone_id: null,
          story_points: null,
          sort_order: 1,
          created_at: new Date().toISOString(),
          description: null,
        },
      ],
    },
  ],
};

const baseFilterParams = {
  projectStatus: [],
  epicStatus: [],
  issuePriority: [],
  issueStatus: [],
  issueStoryPoints: [],
  groupBy: 'none',
  sortBy: 'priority',
  sortDir: 'asc',
};

const pageData = {
  projects: [baseProject],
  filterParams: baseFilterParams,
  milestones: [],
  session: { user: { id: 'user-1' } },
} as unknown as PageData;

const emptyPageData = {
  projects: [],
  filterParams: baseFilterParams,
  milestones: [],
  session: { user: { id: 'user-1' } },
} as unknown as PageData;

const emptyWithFiltersData = {
  projects: [],
  filterParams: {
    ...baseFilterParams,
    issuePriority: [0, 1],
  },
  milestones: [],
  session: { user: { id: 'user-1' } },
} as unknown as PageData;

beforeEach(() => {
  vi.clearAllMocks();
  mockPageStore = writable({
    url: new URL('http://localhost/projects'),
    form: null,
  });
  mockInvalidateAll.mockResolvedValue(undefined);
  global.fetch = vi.fn();
  toastSuccessMock.mockReset();
  toastErrorMock.mockReset();
});

// --- Tests ---

describe('ProjectsPage - Header rendering', () => {
  it('renders the Projects heading', () => {
    render(ProjectsPage, { props: { data: pageData } });
    expect(screen.getByRole('heading', { name: 'Projects' })).toBeInTheDocument();
  });

  it('renders Filters button', () => {
    render(ProjectsPage, { props: { data: pageData } });
    expect(screen.getByRole('button', { name: /Filters/i })).toBeInTheDocument();
  });

  it('shows active filter count badge when filters are set', () => {
    render(ProjectsPage, { props: { data: emptyWithFiltersData } });
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('does not show filter count badge when no filters are active', () => {
    render(ProjectsPage, { props: { data: pageData } });
    expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument();
  });
});

describe('ProjectsPage - Filter panel toggle', () => {
  it('toggles filterPanelOpen when Filters button is clicked', async () => {
    render(ProjectsPage, { props: { data: pageData } });
    const filtersBtn = screen.getByRole('button', { name: /Filters/i });

    // Initially closed
    expect(filtersBtn).toHaveAttribute('aria-expanded', 'false');

    await fireEvent.click(filtersBtn);
    expect(filtersBtn).toHaveAttribute('aria-expanded', 'true');

    await fireEvent.click(filtersBtn);
    expect(filtersBtn).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('ProjectsPage - toggleExpand via TreeGrid', () => {
  it('sets ?project= in URL when expanding a project', async () => {
    render(ProjectsPage, { props: { data: pageData } });
    await fireEvent.click(screen.getByRole('button', { name: 'Toggle expand project' }));

    expect(mockGoto).toHaveBeenCalledOnce();
    const calledUrl = mockGoto.mock.calls[0][0] as URL;
    expect(calledUrl.searchParams.get('project')).toBe('project-1');
  });

  it('clears ?project and ?epic when collapsing an already-expanded project', async () => {
    mockPageStore.set({
      url: new URL('http://localhost/projects?project=project-1&epic=epic-1'),
      form: null,
    });
    render(ProjectsPage, { props: { data: pageData } });
    await fireEvent.click(screen.getByRole('button', { name: 'Toggle expand project' }));

    const calledUrl = mockGoto.mock.calls[0][0] as URL;
    expect(calledUrl.searchParams.get('project')).toBeNull();
    expect(calledUrl.searchParams.get('epic')).toBeNull();
  });

  it('sets ?epic= in URL when expanding an epic', async () => {
    render(ProjectsPage, { props: { data: pageData } });
    await fireEvent.click(screen.getByRole('button', { name: 'Toggle expand epic' }));

    const calledUrl = mockGoto.mock.calls[0][0] as URL;
    expect(calledUrl.searchParams.get('epic')).toBe('epic-1');
  });

  it('clears only ?epic when collapsing an already-expanded epic', async () => {
    mockPageStore.set({
      url: new URL('http://localhost/projects?project=project-1&epic=epic-1'),
      form: null,
    });
    render(ProjectsPage, { props: { data: pageData } });
    await fireEvent.click(screen.getByRole('button', { name: 'Toggle expand epic' }));

    const calledUrl = mockGoto.mock.calls[0][0] as URL;
    expect(calledUrl.searchParams.get('epic')).toBeNull();
    expect(calledUrl.searchParams.get('project')).toBe('project-1');
  });
});

describe('ProjectsPage - handleCellEdit via TreeGrid', () => {
  it('calls fetch with ?/updateCell and shows success toast on success', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({ ok: true } as Response);
    render(ProjectsPage, { props: { data: pageData } });

    await fireEvent.click(screen.getByRole('button', { name: 'Cell edit project' }));

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('?/updateCell'),
      expect.objectContaining({ method: 'POST' }),
    );
    await waitFor(() => {
      expect(mockInvalidateAll).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(toastSuccessMock).toHaveBeenCalledWith('Updated successfully');
    });
  });

  it('shows error toast on failed cell edit', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false } as Response);
    render(ProjectsPage, { props: { data: pageData } });

    await fireEvent.click(screen.getByRole('button', { name: 'Cell edit project' }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith('Failed to update');
    });
  });

  it('identifies project nodeType when editing a project node', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({ ok: true } as Response);
    render(ProjectsPage, { props: { data: pageData } });

    await fireEvent.click(screen.getByRole('button', { name: 'Cell edit project' }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const formData = vi.mocked(global.fetch).mock.calls[0][1]!.body as FormData;
    expect(formData.get('nodeType')).toBe('project');
  });

  it('identifies epic nodeType when editing an epic node', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({ ok: true } as Response);
    render(ProjectsPage, { props: { data: pageData } });

    await fireEvent.click(screen.getByRole('button', { name: 'Cell edit epic' }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const formData = vi.mocked(global.fetch).mock.calls[0][1]!.body as FormData;
    expect(formData.get('nodeType')).toBe('epic');
  });

  it('identifies issue nodeType when editing an issue node', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({ ok: true } as Response);
    render(ProjectsPage, { props: { data: pageData } });

    await fireEvent.click(screen.getByRole('button', { name: 'Cell edit issue' }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const formData = vi.mocked(global.fetch).mock.calls[0][1]!.body as FormData;
    expect(formData.get('nodeType')).toBe('issue');
  });

  it('shows error toast when fetch throws', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('network error'));
    render(ProjectsPage, { props: { data: pageData } });

    await fireEvent.click(screen.getByRole('button', { name: 'Cell edit project' }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith('Failed to update');
    });
    consoleSpy.mockRestore();
  });
});

describe('ProjectsPage - handleCreateChild via TreeGrid', () => {
  it('calls ?/createEpic when creating a child of a project', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({ ok: true } as Response);
    render(ProjectsPage, { props: { data: pageData } });

    await fireEvent.click(screen.getByRole('button', { name: 'Create epic child' }));

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('?/createEpic'),
      expect.objectContaining({ method: 'POST' }),
    );
    await waitFor(() => {
      expect(toastSuccessMock).toHaveBeenCalledWith('Epic created');
    });
  });

  it('calls ?/createIssue when creating a child of an epic', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          type: 'success',
          data: {
            issue: {
              id: 'issue-2',
              title: 'New Issue',
              status: 'todo',
              priority: 1,
              project_id: 'project-1',
              epic_id: 'epic-1',
              milestone_id: null,
              story_points: null,
              sort_order: 2,
              created_at: new Date().toISOString(),
              parent_issue_id: null,
              description: null,
            },
          },
          status: 200,
        }),
    } as unknown as Response);
    render(ProjectsPage, { props: { data: pageData } });

    await fireEvent.click(screen.getByRole('button', { name: 'Create issue child' }));

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('?/createIssue'),
      expect.objectContaining({ method: 'POST' }),
    );
    await waitFor(() => {
      expect(toastSuccessMock).toHaveBeenCalledWith('Issue created');
    });
  });

  it('shows error toast when epic creation fails', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false } as Response);
    render(ProjectsPage, { props: { data: pageData } });

    await fireEvent.click(screen.getByRole('button', { name: 'Create epic child' }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith('Failed to create epic');
    });
  });

  it('shows error toast when issue creation fails', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      text: async () =>
        JSON.stringify({ type: 'failure', data: { error: 'Server error' }, status: 400 }),
    } as unknown as Response);
    render(ProjectsPage, { props: { data: pageData } });

    await fireEvent.click(screen.getByRole('button', { name: 'Create issue child' }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith('Failed to create issue');
    });
  });
});

describe('ProjectsPage - empty state rendering', () => {
  it('does not render TreeGrid when projects array is empty', () => {
    render(ProjectsPage, { props: { data: emptyPageData } });
    expect(screen.queryByRole('button', { name: 'Create epic child' })).not.toBeInTheDocument();
  });

  it('renders TreeGrid action buttons when projects array is non-empty', () => {
    render(ProjectsPage, { props: { data: pageData } });
    expect(screen.getByRole('button', { name: 'Toggle expand project' })).toBeInTheDocument();
  });

  it('shows Projects heading regardless of empty state', () => {
    render(ProjectsPage, { props: { data: emptyPageData } });
    expect(screen.getByRole('heading', { name: 'Projects' })).toBeInTheDocument();
  });
});

describe('ProjectsPage - active filter count computation', () => {
  it('computes activeFilterCount as sum of all filter arrays', () => {
    const multiFilterData = {
      ...pageData,
      filterParams: {
        ...baseFilterParams,
        issuePriority: [0, 1],
        issueStatus: ['todo'],
        issueStoryPoints: [5],
      },
    } as unknown as PageData;

    render(ProjectsPage, { props: { data: multiFilterData } });
    // 2 priorities + 1 status + 1 story point = 4
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('shows 0 badge (no badge) when all filter arrays are empty', () => {
    render(ProjectsPage, { props: { data: pageData } });
    expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument();
  });
});
