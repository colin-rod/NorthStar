# Home View Project Filter - Implementation Plan

**Date**: 2026-02-12
**Design Doc**: [2026-02-12-home-view-project-filter-design.md](./2026-02-12-home-view-project-filter-design.md)
**Issue**: Issue 5.5 — Home view: Ready / Doing / Blocked lists (global)

## Overview

This plan follows strict TDD (Test-Driven Development) methodology as required by CLAUDE.md. Every code change begins with a failing test (RED), then minimal implementation (GREEN), followed by refactoring (REFACTOR).

## Implementation Steps

### Step 1: URL Parsing Utility (TDD Cycle 1)

**Goal**: Create helper function to parse project IDs from URL query parameter

**RED - Write failing test**:

File: `tests/unit/utils/url-helpers.test.ts` (new file)

```typescript
import { describe, it, expect } from 'vitest';
import { parseProjectIds } from '$lib/utils/url-helpers';

describe('parseProjectIds', () => {
  it('returns empty array for null param', () => {
    expect(parseProjectIds(null)).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    expect(parseProjectIds('')).toEqual([]);
  });

  it('splits comma-separated UUIDs', () => {
    const ids = 'uuid1,uuid2,uuid3';
    expect(parseProjectIds(ids)).toEqual(['uuid1', 'uuid2', 'uuid3']);
  });

  it('filters out empty strings from malformed input', () => {
    expect(parseProjectIds('uuid1,,uuid2')).toEqual(['uuid1', 'uuid2']);
  });

  it('trims whitespace from UUIDs', () => {
    expect(parseProjectIds('uuid1, uuid2 ,uuid3')).toEqual(['uuid1', 'uuid2', 'uuid3']);
  });
});
```

**Verification**: Run `npm run test tests/unit/utils/url-helpers.test.ts` → should FAIL (function doesn't exist)

**GREEN - Minimal implementation**:

File: `src/lib/utils/url-helpers.ts` (new file)

```typescript
/**
 * Parse project IDs from URL query parameter
 * @param param - Comma-separated project IDs from query string
 * @returns Array of project ID strings
 */
export function parseProjectIds(param: string | null): string[] {
  if (!param || param.trim().length === 0) {
    return [];
  }

  return param
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
}
```

**Verification**: Run `npm run test tests/unit/utils/url-helpers.test.ts` → should PASS

**REFACTOR**: Code is already simple and clean, no refactoring needed

---

### Step 2: Server Load Function with Project Filtering (TDD Cycle 2)

**Goal**: Update home page server load to filter issues by project IDs from URL

**RED - Write failing test**:

File: `tests/integration/server/home-load.test.ts` (new file)

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { load } from '../../../src/routes/(protected)/+page.server';
import { createClient } from '@supabase/supabase-js';

// Test setup
const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.PUBLIC_SUPABASE_ANON_KEY!,
);

let testUserId: string;
let testProjects: Array<{ id: string; name: string }>;
let testIssues: Array<{ id: string; project_id: string }>;

beforeEach(async () => {
  // Create test user, projects, and issues
  // (Implementation details for test data setup)
});

afterEach(async () => {
  // Clean up test data
  // (Implementation details for cleanup)
});

describe('Home page load function', () => {
  it('returns all issues when no projects param', async () => {
    const url = new URL('http://localhost/');
    const result = await load({
      locals: { supabase, session: { user: { id: testUserId } } },
      url,
    } as any);

    expect(result.issues.length).toBe(testIssues.length);
    expect(result.selectedProjectIds).toEqual([]);
  });

  it('filters issues by single project', async () => {
    const projectId = testProjects[0].id;
    const url = new URL(`http://localhost/?projects=${projectId}`);

    const result = await load({
      locals: { supabase, session: { user: { id: testUserId } } },
      url,
    } as any);

    expect(result.issues.every((i) => i.project_id === projectId)).toBe(true);
    expect(result.selectedProjectIds).toEqual([projectId]);
  });

  it('filters issues by multiple projects', async () => {
    const projectIds = [testProjects[0].id, testProjects[1].id];
    const url = new URL(`http://localhost/?projects=${projectIds.join(',')}`);

    const result = await load({
      locals: { supabase, session: { user: { id: testUserId } } },
      url,
    } as any);

    const returnedProjectIds = result.issues.map((i) => i.project_id);
    expect(returnedProjectIds.every((id) => projectIds.includes(id))).toBe(true);
    expect(result.selectedProjectIds).toEqual(projectIds);
  });

  it('returns projects list for filter dropdown', async () => {
    const url = new URL('http://localhost/');
    const result = await load({
      locals: { supabase, session: { user: { id: testUserId } } },
      url,
    } as any);

    expect(result.projects).toBeDefined();
    expect(result.projects.length).toBe(testProjects.length);
    expect(result.projects[0]).toHaveProperty('id');
    expect(result.projects[0]).toHaveProperty('name');
  });
});
```

**Verification**: Run `npm run test tests/integration/server/home-load.test.ts` → should FAIL (filtering not implemented)

**GREEN - Implement server-side filtering**:

File: `src/routes/(protected)/+page.server.ts` (modify existing)

```typescript
import { parseProjectIds } from '$lib/utils/url-helpers';

export const load: PageServerLoad = async ({ locals, url }) => {
  // 1. Parse projects query param
  const projectsParam = url.searchParams.get('projects');
  const selectedProjectIds = parseProjectIds(projectsParam);

  // 2. Build issues query
  let issuesQuery = locals.supabase.from('issues').select(
    `
      *,
      project:projects(*),
      epic:epics(*),
      milestone:milestones(*),
      dependencies!dependencies_issue_id_fkey(
        depends_on_issue_id,
        depends_on_issue:issues(*, epic:epics(*), project:projects(*))
      ),
      blocked_by:dependencies!dependencies_issue_id_fkey(
        depends_on_issue_id,
        depends_on_issue:issues(
          id, title, status, priority, epic_id, project_id,
          epic:epics(id, name),
          project:projects(id, name)
        )
      ),
      blocking:dependencies!dependencies_depends_on_issue_id_fkey(
        issue_id,
        issue:issues(
          id, title, status, priority, epic_id, project_id,
          epic:epics(id, name),
          project:projects(id, name)
        )
      ),
      sub_issues:issues!parent_issue_id(
        id,
        title,
        status,
        priority,
        sort_order
      )
    `,
  );

  // 3. Apply project filter if specified
  if (selectedProjectIds.length > 0) {
    issuesQuery = issuesQuery.in('project_id', selectedProjectIds);
  }

  const { data: issues, error } = await issuesQuery.order('sort_order', { ascending: true });

  if (error) {
    console.error('Error loading issues:', error);
    return { issues: [], projects: [], epics: [], milestones: [], selectedProjectIds: [] };
  }

  // 4. Load projects for filter dropdown
  const { data: projects } = await locals.supabase
    .from('projects')
    .select('id, name')
    .order('name', { ascending: true });

  // 5. Load epics and milestones (unchanged)
  const { data: epics } = await locals.supabase
    .from('epics')
    .select('*')
    .order('sort_order', { ascending: true });

  const { data: milestones } = await locals.supabase
    .from('milestones')
    .select('*')
    .order('name', { ascending: true });

  return {
    issues: issues || [],
    projects: projects || [],
    epics: epics || [],
    milestones: milestones || [],
    selectedProjectIds,
  };
};
```

**Verification**: Run `npm run test tests/integration/server/home-load.test.ts` → should PASS

**REFACTOR**: Extract query building if needed (likely not necessary at this stage)

---

### Step 3: ProjectFilter Component (TDD Cycle 3)

**Goal**: Create reusable component for multi-select project filtering

**RED - Write failing component test**:

File: `tests/component/ProjectFilter.test.ts` (new file)

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import ProjectFilter from '$lib/components/ProjectFilter.svelte';

// Mock SvelteKit navigation
vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
}));

vi.mock('$app/stores', () => ({
  page: {
    subscribe: vi.fn((callback) => {
      callback({ url: new URL('http://localhost/') });
      return () => {};
    }),
  },
}));

const mockProjects = [
  { id: 'project-1', name: 'Project Alpha' },
  { id: 'project-2', name: 'Project Beta' },
  { id: 'project-3', name: 'Project Gamma' },
];

describe('ProjectFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays "All Projects" when no selection', () => {
    render(ProjectFilter, {
      props: {
        projects: mockProjects,
        selectedProjectIds: [],
      },
    });

    expect(screen.getByText('All Projects')).toBeInTheDocument();
  });

  it('displays project count when projects selected', () => {
    render(ProjectFilter, {
      props: {
        projects: mockProjects,
        selectedProjectIds: ['project-1', 'project-2'],
      },
    });

    expect(screen.getByText('Projects (2)')).toBeInTheDocument();
  });

  it('opens popover when trigger clicked', async () => {
    render(ProjectFilter, {
      props: {
        projects: mockProjects,
        selectedProjectIds: [],
      },
    });

    const trigger = screen.getByText('All Projects');
    await userEvent.click(trigger);

    // Popover should show project list
    expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    expect(screen.getByText('Project Beta')).toBeInTheDocument();
  });

  it('filters projects by search query', async () => {
    render(ProjectFilter, {
      props: {
        projects: mockProjects,
        selectedProjectIds: [],
      },
    });

    await userEvent.click(screen.getByText('All Projects'));

    const searchInput = screen.getByPlaceholderText('Search projects...');
    await userEvent.type(searchInput, 'Alpha');

    expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    expect(screen.queryByText('Project Beta')).not.toBeInTheDocument();
  });

  it('updates URL when project toggled', async () => {
    const { goto } = await import('$app/navigation');

    render(ProjectFilter, {
      props: {
        projects: mockProjects,
        selectedProjectIds: [],
      },
    });

    await userEvent.click(screen.getByText('All Projects'));
    await userEvent.click(screen.getByText('Project Alpha'));

    expect(goto).toHaveBeenCalledWith(
      '/?projects=project-1',
      expect.objectContaining({
        replaceState: false,
        keepFocus: true,
        noScroll: true,
      }),
    );
  });

  it('removes project from selection when unchecked', async () => {
    const { goto } = await import('$app/navigation');

    render(ProjectFilter, {
      props: {
        projects: mockProjects,
        selectedProjectIds: ['project-1', 'project-2'],
      },
    });

    await userEvent.click(screen.getByText('Projects (2)'));
    await userEvent.click(screen.getByLabelText('Project Alpha')); // Uncheck

    expect(goto).toHaveBeenCalledWith('/?projects=project-2', expect.anything());
  });

  it('clears URL param when all projects unchecked', async () => {
    const { goto } = await import('$app/navigation');

    render(ProjectFilter, {
      props: {
        projects: mockProjects,
        selectedProjectIds: ['project-1'],
      },
    });

    await userEvent.click(screen.getByText('Projects (1)'));
    await userEvent.click(screen.getByLabelText('Project Alpha')); // Uncheck last

    expect(goto).toHaveBeenCalledWith('/', expect.anything());
  });
});
```

**Verification**: Run `npm run test tests/component/ProjectFilter.test.ts` → should FAIL (component doesn't exist)

**GREEN - Implement ProjectFilter component**:

First, ensure required shadcn components are installed:

```bash
npx shadcn-svelte@latest add popover command checkbox
```

File: `src/lib/components/ProjectFilter.svelte` (new file)

```svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
  import { Command, CommandInput, CommandList, CommandItem } from '$lib/components/ui/command';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { Button } from '$lib/components/ui/button';

  export let projects: Array<{ id: string; name: string }>;
  export let selectedProjectIds: string[];

  let open = false;
  let searchQuery = '';

  // Filtered projects based on search
  $: filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Display text for trigger button
  $: buttonText =
    selectedProjectIds.length === 0 ? 'All Projects' : `Projects (${selectedProjectIds.length})`;

  function toggleProject(projectId: string) {
    const newSelection = selectedProjectIds.includes(projectId)
      ? selectedProjectIds.filter((id) => id !== projectId)
      : [...selectedProjectIds, projectId];

    updateURL(newSelection);
  }

  function updateURL(projectIds: string[]) {
    const params = new URLSearchParams($page.url.searchParams);

    if (projectIds.length === 0) {
      params.delete('projects');
    } else {
      params.set('projects', projectIds.join(','));
    }

    const newUrl = params.toString() ? `/?${params.toString()}` : '/';

    goto(newUrl, {
      replaceState: false, // Enable browser back button
      keepFocus: true, // Keep popover open
      noScroll: true, // Maintain scroll position
    });
  }
</script>

<Popover bind:open>
  <PopoverTrigger asChild let:builder>
    <Button builders={[builder]} variant="outline" class="justify-start">
      {buttonText}
    </Button>
  </PopoverTrigger>
  <PopoverContent class="w-[300px] p-0" align="start">
    <Command>
      <CommandInput placeholder="Search projects..." bind:value={searchQuery} />
      <CommandList>
        {#each filteredProjects as project (project.id)}
          <CommandItem
            onSelect={() => toggleProject(project.id)}
            class="flex items-center gap-2 cursor-pointer"
          >
            <Checkbox checked={selectedProjectIds.includes(project.id)} aria-label={project.name} />
            <span>{project.name}</span>
          </CommandItem>
        {/each}
        {#if filteredProjects.length === 0}
          <div class="py-6 text-center text-sm text-muted-foreground">No projects found</div>
        {/if}
      </CommandList>
    </Command>
  </PopoverContent>
</Popover>
```

**Verification**: Run `npm run test tests/component/ProjectFilter.test.ts` → should PASS

**REFACTOR**: Review component for simplification opportunities

- Extract `toggleProject` logic if it grows more complex
- Consider splitting URL building into separate function if needed

---

### Step 4: Integrate ProjectFilter into Home Page (TDD Cycle 4)

**Goal**: Add filter component to home page layout

**RED - Write failing E2E test**:

File: `tests/e2e/project-filtering.test.ts` (new file)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Project filtering on home page', () => {
  test('displays all projects by default', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('All Projects')).toBeVisible();
  });

  test('filters issues by single project', async ({ page }) => {
    await page.goto('/');

    // Count total issues
    const allIssuesCount = await page.locator('[data-testid="issue-row"]').count();

    // Open filter
    await page.click('text=All Projects');

    // Select first project
    await page.click('[data-testid="project-checkbox"]:first-child');

    // Verify URL updated
    expect(page.url()).toContain('projects=');

    // Verify button text updated
    await expect(page.getByText('Projects (1)')).toBeVisible();

    // Verify filtered count is less than total
    const filteredCount = await page.locator('[data-testid="issue-row"]').count();
    expect(filteredCount).toBeLessThanOrEqual(allIssuesCount);
  });

  test('filters issues by multiple projects', async ({ page }) => {
    await page.goto('/');

    await page.click('text=All Projects');
    await page.click('[data-testid="project-checkbox"]:nth-child(1)');
    await page.click('[data-testid="project-checkbox"]:nth-child(2)');

    await expect(page.getByText('Projects (2)')).toBeVisible();
    expect(page.url()).toContain('projects=');
  });

  test('browser back button restores previous filter state', async ({ page }) => {
    await page.goto('/');

    // Select a project
    await page.click('text=All Projects');
    await page.click('[data-testid="project-checkbox"]:first-child');
    await expect(page.getByText('Projects (1)')).toBeVisible();

    // Go back
    await page.goBack();

    // Should show all projects again
    await expect(page.getByText('All Projects')).toBeVisible();
  });

  test('search filters project list', async ({ page }) => {
    await page.goto('/');

    await page.click('text=All Projects');
    await page.fill('input[placeholder="Search projects..."]', 'Alpha');

    // Only matching projects should be visible
    await expect(page.getByText('Project Alpha')).toBeVisible();
    await expect(page.getByText('Project Beta')).not.toBeVisible();
  });
});
```

**Verification**: Run `npm run test:e2e` → should FAIL (filter not integrated)

**GREEN - Integrate component**:

File: `src/routes/(protected)/+page.svelte` (modify existing)

```svelte
<script lang="ts">
  import type { PageData } from './$types';
  import { Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/components/ui/tabs';
  import IssueList from '$lib/components/IssueList.svelte';
  import IssueSheet from '$lib/components/IssueSheet.svelte';
  import ProjectFilter from '$lib/components/ProjectFilter.svelte';
  import { issues, selectedIssue, isIssueSheetOpen, openIssueSheet } from '$lib/stores/issues';
  import { readyIssues, doingIssues, blockedIssues, doneIssues } from '$lib/stores/computed';

  export let data: PageData;

  // Initialize store with loaded data
  $: issues.set(data.issues || []);
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <h1 class="text-3xl font-bold">Issues</h1>
    <!-- TODO: Add "New Issue" button -->
  </div>

  <!-- Project Filter -->
  <ProjectFilter
    projects={data.projects || []}
    selectedProjectIds={data.selectedProjectIds || []}
  />

  <!-- Segmented Filters -->
  <Tabs defaultValue="ready" class="w-full">
    <!-- Rest of tabs implementation unchanged -->
    <TabsList class="grid w-full grid-cols-4">
      <TabsTrigger value="ready">
        Ready ({$readyIssues.length})
      </TabsTrigger>
      <TabsTrigger value="doing">
        Doing ({$doingIssues.length})
      </TabsTrigger>
      <TabsTrigger value="blocked">
        Blocked ({$blockedIssues.length})
      </TabsTrigger>
      <TabsTrigger value="done">
        Done ({$doneIssues.length})
      </TabsTrigger>
    </TabsList>

    <TabsContent value="ready" class="mt-4">
      {#if $readyIssues.length === 0}
        <p class="text-center text-muted-foreground py-8">No ready issues</p>
      {:else}
        <IssueList issues={$readyIssues} onIssueClick={openIssueSheet} />
      {/if}
    </TabsContent>

    <TabsContent value="doing" class="mt-4">
      {#if $doingIssues.length === 0}
        <p class="text-center text-muted-foreground py-8">No issues in progress</p>
      {:else}
        <IssueList issues={$doingIssues} onIssueClick={openIssueSheet} />
      {/if}
    </TabsContent>

    <TabsContent value="blocked" class="mt-4">
      {#if $blockedIssues.length === 0}
        <p class="text-center text-muted-foreground py-8">No blocked issues</p>
      {:else}
        <IssueList issues={$blockedIssues} onIssueClick={openIssueSheet} />
      {/if}
    </TabsContent>

    <TabsContent value="done" class="mt-4">
      {#if $doneIssues.length === 0}
        <p class="text-center text-muted-foreground py-8">No completed issues</p>
      {:else}
        <IssueList issues={$doneIssues} onIssueClick={openIssueSheet} />
      {/if}
    </TabsContent>
  </Tabs>
</div>

<!-- Issue Detail Sheet -->
<IssueSheet
  bind:open={$isIssueSheetOpen}
  issue={$selectedIssue}
  epics={data.epics || []}
  milestones={data.milestones || []}
  projectIssues={data.issues || []}
/>
```

**Verification**: Run `npm run test:e2e` → should PASS

**REFACTOR**: None needed - integration is clean and minimal

---

### Step 5: Add Test Data IDs for E2E Testing

**Goal**: Make E2E tests more reliable with data-testid attributes

File: `src/lib/components/IssueRow.svelte` (modify existing)

Add `data-testid="issue-row"` to the root element of IssueRow component

File: `src/lib/components/ProjectFilter.svelte` (modify)

Add `data-testid="project-checkbox"` to checkbox elements

**Verification**: Re-run E2E tests to ensure they pass with data attributes

---

## Verification Checklist

After completing all steps, verify:

- [ ] All unit tests pass (`npm run test tests/unit`)
- [ ] All integration tests pass (`npm run test tests/integration`)
- [ ] All component tests pass (`npm run test tests/component`)
- [ ] All E2E tests pass (`npm run test:e2e`)
- [ ] No TypeScript errors (`npm run check`)
- [ ] No linting errors (`npm run lint`)
- [ ] Manual testing on mobile device (touch interactions, popover behavior)
- [ ] Browser back/forward buttons work correctly
- [ ] URL bookmarking works (copy URL, paste in new tab, filter state preserved)
- [ ] Empty state messages display correctly when filtered
- [ ] Search filtering works smoothly

## Acceptance Criteria (from Issue 5.5)

✅ **Global lists across projects** - Implemented with optional filtering
✅ **Tapping an issue opens drawer** - Existing behavior preserved
✅ **Works smoothly on mobile** - Server-side filtering, touch-friendly UI

## Definition of Done

- All tests written and passing
- Code follows TDD red-green-refactor cycle
- Component is accessible (keyboard navigation, ARIA labels)
- Mobile-optimized (tested on actual device)
- Browser history works correctly
- No console errors or warnings
- Code reviewed for simplicity and YAGNI compliance
- Documentation updated (if needed)

## Notes

- Follow Principle 1 (Think Before Coding): Ask if anything is unclear
- Follow Principle 2 (Simplicity First): Minimal code, no speculation
- Follow Principle 3 (Surgical Changes): Only touch what's needed
- Follow Principle 4 (Goal-Driven Execution): Verify at each checkpoint
