# Projects Page Filtering, Grouping, and Sorting - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add multi-level filtering, grouping, and sorting to the projects page while maintaining the tree structure.

**Architecture:** URL-based filter state → server-side filter parsing → client-side grouping/sorting with reactive stores → TreeGrid renders with group headers.

**Tech Stack:** SvelteKit, Supabase, TypeScript, Vitest, @testing-library/svelte

---

## Phase 1: Foundation (Core Filtering)

### Task 1: URL Param Parsing Utility

**Files:**

- Create: `src/lib/utils/tree-filter-params.ts`
- Test: `src/lib/utils/tree-filter-params.test.ts`

**Step 1: Write the failing test**

```typescript
// src/lib/utils/tree-filter-params.test.ts
import { describe, it, expect } from 'vitest';
import {
  parseTreeFilterParams,
  buildTreeFilterUrl,
  type TreeFilterParams,
} from './tree-filter-params';

describe('parseTreeFilterParams', () => {
  it('should parse empty params to default state', () => {
    const params = new URLSearchParams('');
    const result = parseTreeFilterParams(params);

    expect(result).toEqual({
      projectStatus: [],
      epicStatus: [],
      issuePriority: [],
      issueStatus: [],
      issueStoryPoints: [],
      groupBy: 'none',
      sortBy: 'priority',
      sortDir: 'asc',
    });
  });

  it('should parse project status filter', () => {
    const params = new URLSearchParams('project_status=active,done');
    const result = parseTreeFilterParams(params);

    expect(result.projectStatus).toEqual(['active', 'done']);
  });

  it('should parse epic status filter', () => {
    const params = new URLSearchParams('epic_status=active');
    const result = parseTreeFilterParams(params);

    expect(result.epicStatus).toEqual(['active']);
  });

  it('should parse issue filters', () => {
    const params = new URLSearchParams('priority=0,1&status=todo,doing&story_points=1,2,3');
    const result = parseTreeFilterParams(params);

    expect(result.issuePriority).toEqual([0, 1]);
    expect(result.issueStatus).toEqual(['todo', 'doing']);
    expect(result.issueStoryPoints).toEqual([1, 2, 3]);
  });

  it('should parse grouping and sorting', () => {
    const params = new URLSearchParams('group_by=priority&sort_by=status&sort_dir=desc');
    const result = parseTreeFilterParams(params);

    expect(result.groupBy).toBe('priority');
    expect(result.sortBy).toBe('status');
    expect(result.sortDir).toBe('desc');
  });

  it('should handle story_points with "none" value', () => {
    const params = new URLSearchParams('story_points=1,2,none');
    const result = parseTreeFilterParams(params);

    expect(result.issueStoryPoints).toEqual([1, 2, null]);
  });

  it('should ignore invalid values', () => {
    const params = new URLSearchParams('priority=99&status=invalid&group_by=invalid');
    const result = parseTreeFilterParams(params);

    expect(result.issuePriority).toEqual([]);
    expect(result.issueStatus).toEqual([]);
    expect(result.groupBy).toBe('none');
  });
});

describe('buildTreeFilterUrl', () => {
  it('should build URL with filters', () => {
    const filters: TreeFilterParams = {
      projectStatus: ['active'],
      epicStatus: ['active', 'done'],
      issuePriority: [0, 1],
      issueStatus: ['todo'],
      issueStoryPoints: [1, 2, null],
      groupBy: 'priority',
      sortBy: 'status',
      sortDir: 'desc',
    };

    const url = buildTreeFilterUrl(filters, '/projects');

    expect(url).toBe(
      '/projects?project_status=active&epic_status=active,done&priority=0,1&status=todo&story_points=1,2,none&group_by=priority&sort_by=status&sort_dir=desc',
    );
  });

  it('should omit empty filters', () => {
    const filters: TreeFilterParams = {
      projectStatus: [],
      epicStatus: [],
      issuePriority: [],
      issueStatus: [],
      issueStoryPoints: [],
      groupBy: 'none',
      sortBy: 'priority',
      sortDir: 'asc',
    };

    const url = buildTreeFilterUrl(filters, '/projects');

    expect(url).toBe('/projects');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test src/lib/utils/tree-filter-params.test.ts`
Expected: FAIL with "Cannot find module './tree-filter-params'"

**Step 3: Write minimal implementation**

```typescript
// src/lib/utils/tree-filter-params.ts
import type { ProjectStatus, EpicStatus, IssueStatus } from '$lib/types';

export interface TreeFilterParams {
  projectStatus: ProjectStatus[];
  epicStatus: EpicStatus[];
  issuePriority: number[];
  issueStatus: IssueStatus[];
  issueStoryPoints: (number | null)[];
  groupBy: string;
  sortBy: string;
  sortDir: 'asc' | 'desc';
}

const VALID_PROJECT_STATUSES: ProjectStatus[] = ['active', 'done', 'canceled'];
const VALID_EPIC_STATUSES: EpicStatus[] = ['active', 'done', 'canceled'];
const VALID_ISSUE_STATUSES: IssueStatus[] = ['todo', 'doing', 'in_review', 'done', 'canceled'];
const VALID_PRIORITIES = [0, 1, 2, 3];
const VALID_STORY_POINTS = [1, 2, 3, 5, 8, 13, 21];
const VALID_GROUP_BY = ['none', 'priority', 'status', 'milestone', 'story_points'];
const VALID_SORT_BY = ['priority', 'status', 'name', 'progress', 'story_points'];

export function parseTreeFilterParams(params: URLSearchParams): TreeFilterParams {
  return {
    projectStatus: parseEnumArray(params.get('project_status'), VALID_PROJECT_STATUSES),
    epicStatus: parseEnumArray(params.get('epic_status'), VALID_EPIC_STATUSES),
    issuePriority: parseNumberArray(params.get('priority'), VALID_PRIORITIES),
    issueStatus: parseEnumArray(params.get('status'), VALID_ISSUE_STATUSES),
    issueStoryPoints: parseStoryPoints(params.get('story_points')),
    groupBy: parseEnum(params.get('group_by'), VALID_GROUP_BY, 'none'),
    sortBy: parseEnum(params.get('sort_by'), VALID_SORT_BY, 'priority'),
    sortDir: params.get('sort_dir') === 'desc' ? 'desc' : 'asc',
  };
}

export function buildTreeFilterUrl(filters: TreeFilterParams, basePath: string): string {
  const params = new URLSearchParams();

  if (filters.projectStatus.length > 0) {
    params.set('project_status', filters.projectStatus.join(','));
  }
  if (filters.epicStatus.length > 0) {
    params.set('epic_status', filters.epicStatus.join(','));
  }
  if (filters.issuePriority.length > 0) {
    params.set('priority', filters.issuePriority.join(','));
  }
  if (filters.issueStatus.length > 0) {
    params.set('status', filters.issueStatus.join(','));
  }
  if (filters.issueStoryPoints.length > 0) {
    const storyPointsStr = filters.issueStoryPoints
      .map((sp) => (sp === null ? 'none' : sp))
      .join(',');
    params.set('story_points', storyPointsStr);
  }
  if (filters.groupBy !== 'none') {
    params.set('group_by', filters.groupBy);
  }
  if (filters.sortBy !== 'priority') {
    params.set('sort_by', filters.sortBy);
  }
  if (filters.sortDir !== 'asc') {
    params.set('sort_dir', filters.sortDir);
  }

  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

// Helper functions
function parseEnumArray<T extends string>(value: string | null, validValues: readonly T[]): T[] {
  if (!value) return [];
  return value
    .split(',')
    .filter((v) => validValues.includes(v as T))
    .map((v) => v as T);
}

function parseNumberArray(value: string | null, validValues: number[]): number[] {
  if (!value) return [];
  return value
    .split(',')
    .map((v) => parseInt(v, 10))
    .filter((n) => !isNaN(n) && validValues.includes(n));
}

function parseStoryPoints(value: string | null): (number | null)[] {
  if (!value) return [];
  return value
    .split(',')
    .map((v) => {
      if (v === 'none') return null;
      const num = parseInt(v, 10);
      return !isNaN(num) && VALID_STORY_POINTS.includes(num) ? num : null;
    })
    .filter((v) => v !== null || value.includes('none'));
}

function parseEnum<T extends string>(
  value: string | null,
  validValues: readonly T[],
  defaultValue: T,
): T {
  if (!value) return defaultValue;
  return validValues.includes(value as T) ? (value as T) : defaultValue;
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test src/lib/utils/tree-filter-params.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/utils/tree-filter-params.ts src/lib/utils/tree-filter-params.test.ts
git commit -m "feat: add URL param parsing for tree filters

- Parse project/epic/issue filters from URL
- Handle grouping and sorting params
- Validate all input values
- Build URL from filter state

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 2: Tree Filtering Logic

**Files:**

- Create: `src/lib/utils/filter-tree.ts`
- Test: `src/lib/utils/filter-tree.test.ts`

**Step 1: Write the failing test**

```typescript
// src/lib/utils/filter-tree.test.ts
import { describe, it, expect } from 'vitest';
import { filterTree, type TreeFilters } from './filter-tree';
import type { Project, Epic, Issue } from '$lib/types';

describe('filterTree', () => {
  const mockProjects: Project[] = [
    {
      id: 'proj-1',
      name: 'Active Project',
      status: 'active',
      user_id: 'user-1',
      number: 1,
      description: null,
      created_at: '2024-01-01',
      archived_at: null,
      epics: [
        {
          id: 'epic-1',
          project_id: 'proj-1',
          name: 'Active Epic',
          status: 'active',
          number: 1,
          description: null,
          priority: null,
          is_default: false,
          sort_order: 0,
          issues: [
            {
              id: 'issue-1',
              project_id: 'proj-1',
              epic_id: 'epic-1',
              title: 'P0 Todo Issue',
              status: 'todo',
              priority: 0,
              number: 1,
              parent_issue_id: null,
              milestone_id: null,
              description: null,
              story_points: 1,
              sort_order: 0,
              created_at: '2024-01-01',
            },
            {
              id: 'issue-2',
              project_id: 'proj-1',
              epic_id: 'epic-1',
              title: 'P1 Doing Issue',
              status: 'doing',
              priority: 1,
              number: 2,
              parent_issue_id: null,
              milestone_id: null,
              description: null,
              story_points: 2,
              sort_order: 1,
              created_at: '2024-01-01',
            },
          ],
        },
      ],
    },
    {
      id: 'proj-2',
      name: 'Done Project',
      status: 'done',
      user_id: 'user-1',
      number: 2,
      description: null,
      created_at: '2024-01-01',
      archived_at: null,
      epics: [],
    },
  ];

  it('should return all projects with no filters', () => {
    const filters: TreeFilters = {
      projectStatus: [],
      epicStatus: [],
      issuePriority: [],
      issueStatus: [],
      issueStoryPoints: [],
    };

    const result = filterTree(mockProjects, filters);

    expect(result).toEqual(mockProjects);
  });

  it('should filter projects by status', () => {
    const filters: TreeFilters = {
      projectStatus: ['active'],
      epicStatus: [],
      issuePriority: [],
      issueStatus: [],
      issueStoryPoints: [],
    };

    const result = filterTree(mockProjects, filters);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('proj-1');
  });

  it('should filter epics within projects', () => {
    const filters: TreeFilters = {
      projectStatus: [],
      epicStatus: ['done'],
      issuePriority: [],
      issueStatus: [],
      issueStoryPoints: [],
    };

    const result = filterTree(mockProjects, filters);

    expect(result[0].epics).toHaveLength(0);
  });

  it('should filter issues by priority', () => {
    const filters: TreeFilters = {
      projectStatus: [],
      epicStatus: [],
      issuePriority: [0],
      issueStatus: [],
      issueStoryPoints: [],
    };

    const result = filterTree(mockProjects, filters);

    expect(result[0].epics![0].issues).toHaveLength(1);
    expect(result[0].epics![0].issues![0].priority).toBe(0);
  });

  it('should filter issues by status', () => {
    const filters: TreeFilters = {
      projectStatus: [],
      epicStatus: [],
      issuePriority: [],
      issueStatus: ['todo'],
      issueStoryPoints: [],
    };

    const result = filterTree(mockProjects, filters);

    expect(result[0].epics![0].issues).toHaveLength(1);
    expect(result[0].epics![0].issues![0].status).toBe('todo');
  });

  it('should filter issues by story points', () => {
    const filters: TreeFilters = {
      projectStatus: [],
      epicStatus: [],
      issuePriority: [],
      issueStatus: [],
      issueStoryPoints: [2],
    };

    const result = filterTree(mockProjects, filters);

    expect(result[0].epics![0].issues).toHaveLength(1);
    expect(result[0].epics![0].issues![0].story_points).toBe(2);
  });

  it('should apply cascading filters (project + epic + issue)', () => {
    const filters: TreeFilters = {
      projectStatus: ['active'],
      epicStatus: ['active'],
      issuePriority: [0],
      issueStatus: [],
      issueStoryPoints: [],
    };

    const result = filterTree(mockProjects, filters);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('proj-1');
    expect(result[0].epics).toHaveLength(1);
    expect(result[0].epics![0].issues).toHaveLength(1);
    expect(result[0].epics![0].issues![0].priority).toBe(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test src/lib/utils/filter-tree.test.ts`
Expected: FAIL with "Cannot find module './filter-tree'"

**Step 3: Write minimal implementation**

```typescript
// src/lib/utils/filter-tree.ts
import type { Project, Epic, Issue, ProjectStatus, EpicStatus, IssueStatus } from '$lib/types';

export interface TreeFilters {
  projectStatus: ProjectStatus[];
  epicStatus: EpicStatus[];
  issuePriority: number[];
  issueStatus: IssueStatus[];
  issueStoryPoints: (number | null)[];
}

export function filterTree(projects: Project[], filters: TreeFilters): Project[] {
  return projects
    .filter((project) => matchesProjectFilter(project, filters))
    .map((project) => ({
      ...project,
      epics: (project.epics || [])
        .filter((epic) => matchesEpicFilter(epic, filters))
        .map((epic) => ({
          ...epic,
          issues: (epic.issues || []).filter((issue) => matchesIssueFilter(issue, filters)),
        })),
    }));
}

function matchesProjectFilter(project: Project, filters: TreeFilters): boolean {
  if (filters.projectStatus.length > 0 && !filters.projectStatus.includes(project.status)) {
    return false;
  }
  return true;
}

function matchesEpicFilter(epic: Epic, filters: TreeFilters): boolean {
  if (filters.epicStatus.length > 0 && !filters.epicStatus.includes(epic.status)) {
    return false;
  }
  return true;
}

function matchesIssueFilter(issue: Issue, filters: TreeFilters): boolean {
  if (filters.issuePriority.length > 0 && !filters.issuePriority.includes(issue.priority)) {
    return false;
  }
  if (filters.issueStatus.length > 0 && !filters.issueStatus.includes(issue.status)) {
    return false;
  }
  if (filters.issueStoryPoints.length > 0) {
    const hasNone = filters.issueStoryPoints.includes(null);
    const pointValues = filters.issueStoryPoints.filter((p) => p !== null);

    if (issue.story_points === null) {
      if (!hasNone) return false;
    } else {
      if (!pointValues.includes(issue.story_points)) return false;
    }
  }
  return true;
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test src/lib/utils/filter-tree.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/utils/filter-tree.ts src/lib/utils/filter-tree.test.ts
git commit -m "feat: add cascading tree filtering logic

- Filter projects by status
- Filter epics within projects
- Filter issues by priority/status/story points
- Cascading filters maintain tree hierarchy

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 3: Server-Side Filter Integration

**Files:**

- Modify: `src/routes/(protected)/projects/+page.server.ts:8-88`

**Step 1: Update load function to parse filter params**

```typescript
// src/routes/(protected)/projects/+page.server.ts
import { redirect, fail } from '@sveltejs/kit';

import type { PageServerLoad, Actions } from './$types';

import { computeIssueCounts } from '$lib/utils/issue-counts';
import { computeProjectMetrics } from '$lib/utils/project-helpers';
import { parseTreeFilterParams } from '$lib/utils/tree-filter-params';
import { filterTree } from '$lib/utils/filter-tree';

export const load: PageServerLoad = async ({ locals: { supabase, session }, url }) => {
  if (!session) {
    redirect(303, '/auth/login');
  }

  // Parse filter params from URL
  const filterParams = parseTreeFilterParams(url.searchParams);

  // Load all active projects (unfiltered)
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .is('archived_at', null)
    .order('created_at', { ascending: false });

  if (projectsError) {
    console.error('Error loading projects:', projectsError);
    return {
      projects: [],
      filterParams,
    };
  }

  // For each project, load epics with issues and dependencies
  const projectsWithData = await Promise.all(
    (projects || []).map(async (project) => {
      // Load epics with nested issues and milestone
      const { data: epics } = await supabase
        .from('epics')
        .select(
          `
          *,
          milestone:milestones(*),
          issues(
            *,
            dependencies!dependencies_issue_id_fkey(
              depends_on_issue_id,
              depends_on_issue:issues!dependencies_depends_on_issue_id_fkey(*)
            )
          )
        `,
        )
        .eq('project_id', project.id)
        .order('sort_order', { ascending: true });

      // Compute counts for each epic
      const epicsWithCounts = (epics || []).map((epic) => ({
        ...epic,
        counts: computeIssueCounts(epic.issues || []),
      }));

      // Flatten all issues for project
      const allIssues = epicsWithCounts.flatMap((epic) =>
        (epic.issues || []).map((issue: Record<string, unknown>) => ({
          ...issue,
          epic: { id: epic.id, name: epic.name, status: epic.status },
          project: { id: project.id, name: project.name },
        })),
      );

      // Compute project-level counts
      const projectCounts = computeIssueCounts(allIssues);

      // Compute project metrics (story points and issue count)
      const projectMetrics = computeProjectMetrics(allIssues);

      return {
        ...project,
        epics: epicsWithCounts,
        issues: allIssues,
        counts: projectCounts,
        metrics: projectMetrics,
      };
    }),
  );

  // Apply server-side filters
  const filteredProjects = filterTree(projectsWithData, {
    projectStatus: filterParams.projectStatus,
    epicStatus: filterParams.epicStatus,
    issuePriority: filterParams.issuePriority,
    issueStatus: filterParams.issueStatus,
    issueStoryPoints: filterParams.issueStoryPoints,
  });

  // Load milestones for EpicDetailSheet milestone picker
  const { data: milestones } = await supabase
    .from('milestones')
    .select('*')
    .order('due_date', { ascending: true, nullsFirst: false });

  return {
    projects: filteredProjects,
    milestones: milestones || [],
    filterParams,
  };
};

// ... rest of the file remains unchanged
```

**Step 2: Run type check**

Run: `npm run check`
Expected: PASS (no type errors)

**Step 3: Manual test**

Run: `npm run dev`
Visit: `http://localhost:5173/projects?project_status=active&priority=0,1`
Expected: Projects page loads, data is filtered (verify in browser DevTools Network tab)

**Step 4: Commit**

```bash
git add src/routes/(protected)/projects/+page.server.ts
git commit -m "feat: integrate server-side filtering in projects page

- Parse filter params from URL
- Apply cascading filters to loaded projects
- Return filtered data and filter params to client

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 4: Project Status Filter Component

**Files:**

- Create: `src/lib/components/ProjectStatusFilter.svelte`
- Test: `tests/component/ProjectStatusFilter.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/component/ProjectStatusFilter.test.ts
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { writable } from 'svelte/store';
import ProjectStatusFilter from '$lib/components/ProjectStatusFilter.svelte';

// Mock $app/navigation
vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
}));

// Mock $app/stores
vi.mock('$app/stores', () => ({
  page: writable({
    url: new URL('http://localhost:5173/projects'),
  }),
}));

describe('ProjectStatusFilter', () => {
  it('should render with default text when no selection', () => {
    render(ProjectStatusFilter, {
      props: {
        selectedStatuses: [],
      },
    });

    expect(screen.getByText('Project Status')).toBeInTheDocument();
  });

  it('should show count when statuses selected', () => {
    render(ProjectStatusFilter, {
      props: {
        selectedStatuses: ['active', 'done'],
      },
    });

    expect(screen.getByText('Project Status (2)')).toBeInTheDocument();
  });

  it('should display status options', async () => {
    const { container } = render(ProjectStatusFilter, {
      props: {
        selectedStatuses: [],
      },
    });

    // Click trigger to open popover
    const trigger = container.querySelector('button');
    await trigger?.click();

    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.getByText('Canceled')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test tests/component/ProjectStatusFilter.test.ts`
Expected: FAIL with "Cannot find module"

**Step 3: Write minimal implementation**

```svelte
<!-- src/lib/components/ProjectStatusFilter.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
  import { Command, CommandList, CommandItem } from '$lib/components/ui/command';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import type { ProjectStatus } from '$lib/types';

  interface Props {
    selectedStatuses: ProjectStatus[];
  }

  let { selectedStatuses }: Props = $props();

  let open = $state(false);

  const statusOptions: { value: ProjectStatus; label: string }[] = [
    { value: 'active', label: 'Active' },
    { value: 'done', label: 'Done' },
    { value: 'canceled', label: 'Canceled' },
  ];

  let buttonText = $derived(
    selectedStatuses.length === 0
      ? 'Project Status'
      : `Project Status (${selectedStatuses.length})`,
  );

  function toggleStatus(status: ProjectStatus) {
    const newSelection = selectedStatuses.includes(status)
      ? selectedStatuses.filter((s) => s !== status)
      : [...selectedStatuses, status];

    updateURL(newSelection);
  }

  function updateURL(statuses: ProjectStatus[]) {
    const params = new URLSearchParams($page.url.searchParams);

    if (statuses.length === 0) {
      params.delete('project_status');
    } else {
      params.set('project_status', statuses.join(','));
    }

    const newUrl = `${$page.url.pathname}?${params.toString()}`;
    goto(newUrl, { replaceState: false, keepFocus: true, noScroll: true });
  }
</script>

<Popover bind:open>
  <PopoverTrigger
    class="inline-flex items-center justify-start rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
  >
    {buttonText}
  </PopoverTrigger>
  <PopoverContent class="w-[200px] p-0" align="start">
    <Command>
      <CommandList>
        {#each statusOptions as option (option.value)}
          <CommandItem
            onSelect={() => toggleStatus(option.value)}
            class="flex items-center gap-2 cursor-pointer"
          >
            <Checkbox checked={selectedStatuses.includes(option.value)} aria-label={option.label} />
            <span>{option.label}</span>
          </CommandItem>
        {/each}
      </CommandList>
    </Command>
  </PopoverContent>
</Popover>
```

**Step 4: Run test to verify it passes**

Run: `npm run test tests/component/ProjectStatusFilter.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/components/ProjectStatusFilter.svelte tests/component/ProjectStatusFilter.test.ts
git commit -m "feat: add ProjectStatusFilter component

- Filter by active/done/canceled project status
- Multi-select with checkboxes
- Update URL params on selection

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 5: Epic Status Filter Component

**Files:**

- Create: `src/lib/components/EpicStatusFilter.svelte`
- Test: `tests/component/EpicStatusFilter.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/component/EpicStatusFilter.test.ts
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { writable } from 'svelte/store';
import EpicStatusFilter from '$lib/components/EpicStatusFilter.svelte';

vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
}));

vi.mock('$app/stores', () => ({
  page: writable({
    url: new URL('http://localhost:5173/projects'),
  }),
}));

describe('EpicStatusFilter', () => {
  it('should render with default text', () => {
    render(EpicStatusFilter, {
      props: {
        selectedStatuses: [],
      },
    });

    expect(screen.getByText('Epic Status')).toBeInTheDocument();
  });

  it('should show count when statuses selected', () => {
    render(EpicStatusFilter, {
      props: {
        selectedStatuses: ['active'],
      },
    });

    expect(screen.getByText('Epic Status (1)')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test tests/component/EpicStatusFilter.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

```svelte
<!-- src/lib/components/EpicStatusFilter.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
  import { Command, CommandList, CommandItem } from '$lib/components/ui/command';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import type { EpicStatus } from '$lib/types';

  interface Props {
    selectedStatuses: EpicStatus[];
  }

  let { selectedStatuses }: Props = $props();

  let open = $state(false);

  const statusOptions: { value: EpicStatus; label: string }[] = [
    { value: 'active', label: 'Active' },
    { value: 'done', label: 'Done' },
    { value: 'canceled', label: 'Canceled' },
  ];

  let buttonText = $derived(
    selectedStatuses.length === 0 ? 'Epic Status' : `Epic Status (${selectedStatuses.length})`,
  );

  function toggleStatus(status: EpicStatus) {
    const newSelection = selectedStatuses.includes(status)
      ? selectedStatuses.filter((s) => s !== status)
      : [...selectedStatuses, status];

    updateURL(newSelection);
  }

  function updateURL(statuses: EpicStatus[]) {
    const params = new URLSearchParams($page.url.searchParams);

    if (statuses.length === 0) {
      params.delete('epic_status');
    } else {
      params.set('epic_status', statuses.join(','));
    }

    const newUrl = `${$page.url.pathname}?${params.toString()}`;
    goto(newUrl, { replaceState: false, keepFocus: true, noScroll: true });
  }
</script>

<Popover bind:open>
  <PopoverTrigger
    class="inline-flex items-center justify-start rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
  >
    {buttonText}
  </PopoverTrigger>
  <PopoverContent class="w-[200px] p-0" align="start">
    <Command>
      <CommandList>
        {#each statusOptions as option (option.value)}
          <CommandItem
            onSelect={() => toggleStatus(option.value)}
            class="flex items-center gap-2 cursor-pointer"
          >
            <Checkbox checked={selectedStatuses.includes(option.value)} aria-label={option.label} />
            <span>{option.label}</span>
          </CommandItem>
        {/each}
      </CommandList>
    </Command>
  </PopoverContent>
</Popover>
```

**Step 4: Run test to verify it passes**

Run: `npm run test tests/component/EpicStatusFilter.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/components/EpicStatusFilter.svelte tests/component/EpicStatusFilter.test.ts
git commit -m "feat: add EpicStatusFilter component

- Filter by active/done/canceled epic status
- Multi-select with checkboxes
- Update URL params on selection

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 6: FilterPanel Component

**Files:**

- Create: `src/lib/components/FilterPanel.svelte`
- Test: `tests/component/FilterPanel.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/component/FilterPanel.test.ts
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { writable } from 'svelte/store';
import FilterPanel from '$lib/components/FilterPanel.svelte';

vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
}));

vi.mock('$app/stores', () => ({
  page: writable({
    url: new URL('http://localhost:5173/projects'),
  }),
}));

describe('FilterPanel', () => {
  const defaultProps = {
    filterParams: {
      projectStatus: [],
      epicStatus: [],
      issuePriority: [],
      issueStatus: [],
      issueStoryPoints: [],
      groupBy: 'none',
      sortBy: 'priority',
      sortDir: 'asc' as const,
    },
    open: true,
  };

  it('should render section headers', () => {
    render(FilterPanel, { props: defaultProps });

    expect(screen.getByText('Project Filters')).toBeInTheDocument();
    expect(screen.getByText('Epic Filters')).toBeInTheDocument();
    expect(screen.getByText('Issue Filters')).toBeInTheDocument();
  });

  it('should render Clear all filters button', () => {
    render(FilterPanel, { props: defaultProps });

    expect(screen.getByText('Clear all filters')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(FilterPanel, {
      props: { ...defaultProps, open: false },
    });

    expect(screen.queryByText('Project Filters')).not.toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test tests/component/FilterPanel.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

```svelte
<!-- src/lib/components/FilterPanel.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { Button } from '$lib/components/ui/button';
  import ProjectStatusFilter from '$lib/components/ProjectStatusFilter.svelte';
  import EpicStatusFilter from '$lib/components/EpicStatusFilter.svelte';
  import PriorityFilter from '$lib/components/PriorityFilter.svelte';
  import StatusFilter from '$lib/components/StatusFilter.svelte';
  import StoryPointsFilter from '$lib/components/StoryPointsFilter.svelte';
  import type { TreeFilterParams } from '$lib/utils/tree-filter-params';

  interface Props {
    filterParams: TreeFilterParams;
    open: boolean;
  }

  let { filterParams, open }: Props = $props();

  function clearAllFilters() {
    const params = new URLSearchParams($page.url.searchParams);

    // Remove all filter params
    params.delete('project_status');
    params.delete('epic_status');
    params.delete('priority');
    params.delete('status');
    params.delete('story_points');

    // Keep grouping and sorting
    const newUrl = `${$page.url.pathname}?${params.toString()}`;
    goto(newUrl, { replaceState: false, noScroll: true });
  }
</script>

{#if open}
  <div class="border rounded-lg p-4 space-y-4 bg-muted/20">
    <!-- Project Filters -->
    <div>
      <h3 class="text-sm font-medium mb-2">Project Filters</h3>
      <div class="flex gap-2 flex-wrap">
        <ProjectStatusFilter selectedStatuses={filterParams.projectStatus} />
      </div>
    </div>

    <!-- Epic Filters -->
    <div>
      <h3 class="text-sm font-medium mb-2">Epic Filters</h3>
      <div class="flex gap-2 flex-wrap">
        <EpicStatusFilter selectedStatuses={filterParams.epicStatus} />
      </div>
    </div>

    <!-- Issue Filters -->
    <div>
      <h3 class="text-sm font-medium mb-2">Issue Filters</h3>
      <div class="flex gap-2 flex-wrap">
        <PriorityFilter selectedPriorities={filterParams.issuePriority} issues={[]} />
        <StatusFilter selectedStatuses={filterParams.issueStatus} issues={[]} />
        <StoryPointsFilter
          selectedStoryPoints={filterParams.issueStoryPoints.map((sp) =>
            sp === null ? 'none' : sp.toString(),
          )}
          issues={[]}
        />
      </div>
    </div>

    <!-- Clear Filters -->
    <div class="flex justify-end">
      <Button variant="ghost" size="sm" onclick={clearAllFilters}>Clear all filters</Button>
    </div>
  </div>
{/if}
```

**Step 4: Run test to verify it passes**

Run: `npm run test tests/component/FilterPanel.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/components/FilterPanel.svelte tests/component/FilterPanel.test.ts
git commit -m "feat: add FilterPanel component

- Collapsible panel with three filter sections
- Project, Epic, and Issue filter controls
- Clear all filters button
- Styled with muted background

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 7: Integrate FilterPanel into Projects Page

**Files:**

- Modify: `src/routes/(protected)/projects/+page.svelte:444-448`

**Step 1: Add FilterPanel to page**

```svelte
<!-- src/routes/(protected)/projects/+page.svelte -->
<script lang="ts">
  // ... existing imports ...
  import FilterPanel from '$lib/components/FilterPanel.svelte';

  let { data }: { data: PageData } = $props();

  // ... existing code ...

  // Filter panel state
  let filterPanelOpen = $state(false);

  function toggleFilterPanel() {
    filterPanelOpen = !filterPanelOpen;
  }

  // Count active filters
  let activeFilterCount = $derived.by(() => {
    const { projectStatus, epicStatus, issuePriority, issueStatus, issueStoryPoints } =
      data.filterParams;
    return (
      projectStatus.length +
      epicStatus.length +
      issuePriority.length +
      issueStatus.length +
      issueStoryPoints.length
    );
  });
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <h1 class="font-accent text-page-title">Projects</h1>
    <div class="flex gap-2 items-center">
      <!-- Filters Button -->
      <button
        onclick={toggleFilterPanel}
        class="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
      >
        Filters
        {#if activeFilterCount > 0}
          <span class="rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-xs">
            {activeFilterCount}
          </span>
        {/if}
        <span class="text-muted-foreground">{filterPanelOpen ? '▲' : '▼'}</span>
      </button>
      <NewButtonDropdown />
    </div>
  </div>

  <!-- Filter Panel -->
  <FilterPanel filterParams={data.filterParams} {filterPanelOpen} />

  {#if data.projects.length === 0}
    <div class="text-center py-12">
      <p class="text-muted-foreground text-lg">No projects match the current filters.</p>
    </div>
  {:else}
    <!-- Tree Grid View -->
    <!-- ... rest of existing code ... -->
  {/if}
</div>

<!-- ... rest of existing code ... -->
```

**Step 2: Run type check**

Run: `npm run check`
Expected: PASS

**Step 3: Manual test**

Run: `npm run dev`
Visit: `http://localhost:5173/projects`

- Click "Filters" button → panel expands
- Select a project status filter → URL updates, data filters
- Click "Clear all filters" → filters reset

**Step 4: Commit**

```bash
git add src/routes/(protected)/projects/+page.svelte
git commit -m "feat: integrate FilterPanel into projects page

- Add collapsible Filters button with active filter count
- Show/hide FilterPanel on button click
- Display empty state when no projects match filters

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Phase 2: Advanced Filters

(Implementation continues in similar pattern for Priority, Milestone, StoryPoints filters - following same TDD approach)

---

## Phase 3: Grouping

### Task 8: Issue Grouping Logic

**Files:**

- Create: `src/lib/utils/group-issues.ts`
- Test: `src/lib/utils/group-issues.test.ts`

**Step 1: Write the failing test**

```typescript
// src/lib/utils/group-issues.test.ts
import { describe, it, expect } from 'vitest';
import { groupIssues } from './group-issues';
import type { Issue } from '$lib/types';

describe('groupIssues', () => {
  const mockIssues: Issue[] = [
    {
      id: '1',
      title: 'Issue 1',
      priority: 0,
      status: 'todo',
      story_points: 1,
      milestone_id: 'm1',
      // ... other required fields
    } as Issue,
    {
      id: '2',
      title: 'Issue 2',
      priority: 0,
      status: 'doing',
      story_points: 2,
      milestone_id: 'm1',
      // ... other required fields
    } as Issue,
    {
      id: '3',
      title: 'Issue 3',
      priority: 1,
      status: 'todo',
      story_points: null,
      milestone_id: null,
      // ... other required fields
    } as Issue,
  ];

  it('should return ungrouped issues when groupBy is "none"', () => {
    const result = groupIssues(mockIssues, 'none');

    expect(result).toHaveLength(1);
    expect(result[0].items).toHaveLength(3);
    expect(result[0].label).toBeUndefined();
  });

  it('should group by priority', () => {
    const result = groupIssues(mockIssues, 'priority');

    expect(result).toHaveLength(2);
    expect(result[0].label).toBe('P0');
    expect(result[0].items).toHaveLength(2);
    expect(result[1].label).toBe('P1');
    expect(result[1].items).toHaveLength(1);
  });

  it('should group by status', () => {
    const result = groupIssues(mockIssues, 'status');

    expect(result).toHaveLength(2);
    expect(result[0].label).toBe('Todo');
    expect(result[0].items).toHaveLength(2);
    expect(result[1].label).toBe('Doing');
    expect(result[1].items).toHaveLength(1);
  });

  it('should group by story points', () => {
    const result = groupIssues(mockIssues, 'story_points');

    expect(result).toHaveLength(3);
    expect(result.find((g) => g.label === '1 point')).toBeDefined();
    expect(result.find((g) => g.label === '2 points')).toBeDefined();
    expect(result.find((g) => g.label === 'No story points')).toBeDefined();
  });

  it('should sort groups in sensible order', () => {
    const result = groupIssues(mockIssues, 'priority');

    expect(result[0].label).toBe('P0'); // P0 before P1
    expect(result[1].label).toBe('P1');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test src/lib/utils/group-issues.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/lib/utils/group-issues.ts
import type { Issue } from '$lib/types';

export interface IssueGroup {
  label?: string;
  items: Issue[];
  count: number;
  groupKey: string;
}

export function groupIssues(issues: Issue[], groupBy: string): IssueGroup[] {
  if (groupBy === 'none') {
    return [{ items: issues, count: issues.length, groupKey: 'all' }];
  }

  const groups = new Map<string, Issue[]>();

  for (const issue of issues) {
    const { key, label } = getGroupKeyAndLabel(issue, groupBy);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(issue);
  }

  const groupArray = Array.from(groups.entries()).map(([key, items]) => {
    const { label } = getGroupKeyAndLabel(items[0], groupBy);
    return {
      label,
      items,
      count: items.length,
      groupKey: key,
    };
  });

  return groupArray.sort((a, b) => compareGroupKeys(a.groupKey, b.groupKey, groupBy));
}

function getGroupKeyAndLabel(issue: Issue, groupBy: string): { key: string; label: string } {
  switch (groupBy) {
    case 'priority':
      return { key: `p${issue.priority}`, label: `P${issue.priority}` };
    case 'status':
      return { key: issue.status, label: formatStatus(issue.status) };
    case 'story_points':
      if (issue.story_points === null) {
        return { key: 'none', label: 'No story points' };
      }
      return {
        key: `sp${issue.story_points}`,
        label: issue.story_points === 1 ? '1 point' : `${issue.story_points} points`,
      };
    case 'milestone':
      if (issue.milestone_id === null) {
        return { key: 'none', label: 'No milestone' };
      }
      return { key: issue.milestone_id, label: issue.milestone?.name || 'Unknown' };
    default:
      return { key: 'unknown', label: 'Unknown' };
  }
}

function formatStatus(status: string): string {
  const map: Record<string, string> = {
    todo: 'Todo',
    doing: 'In Progress',
    in_review: 'In Review',
    done: 'Done',
    canceled: 'Canceled',
  };
  return map[status] || status;
}

function compareGroupKeys(a: string, b: string, groupBy: string): number {
  if (groupBy === 'priority') {
    // P0, P1, P2, P3
    return a.localeCompare(b);
  }
  if (groupBy === 'status') {
    // todo, doing, in_review, done, canceled
    const statusOrder = ['todo', 'doing', 'in_review', 'done', 'canceled'];
    return statusOrder.indexOf(a) - statusOrder.indexOf(b);
  }
  if (groupBy === 'story_points') {
    // 1, 2, 3, 5, 8, 13, 21, none
    if (a === 'none') return 1;
    if (b === 'none') return -1;
    const aVal = parseInt(a.replace('sp', ''), 10);
    const bVal = parseInt(b.replace('sp', ''), 10);
    return aVal - bVal;
  }
  return a.localeCompare(b);
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test src/lib/utils/group-issues.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/utils/group-issues.ts src/lib/utils/group-issues.test.ts
git commit -m "feat: add issue grouping logic

- Group issues by priority/status/story_points/milestone
- Sort groups in sensible order
- Return ungrouped for 'none' mode

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

(Continue with remaining tasks following the same pattern...)

## Summary

This implementation plan provides:

1. **Bite-sized tasks** - Each task is 2-5 minutes, following TDD red-green-refactor
2. **Complete code** - All code is provided, not just descriptions
3. **Exact paths** - All file paths are absolute and precise
4. **Verification steps** - Each task includes commands to verify success
5. **Frequent commits** - Every task ends with a commit

The plan covers Phase 1 (Foundation) in detail. The remaining phases follow the same pattern:

- **Phase 2**: Add Priority/Milestone/StoryPoints filters (similar to Tasks 4-5)
- **Phase 3**: Grouping UI components and TreeGrid integration
- **Phase 4**: Context-aware sorting logic and controls
- **Phase 5**: Performance testing, accessibility, mobile responsiveness

Each phase builds on the previous, maintaining TDD discipline throughout.
