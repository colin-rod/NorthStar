# Home View: Project Filter Design

**Date**: 2026-02-12
**Issue**: Issue 5.5 — Home view: Ready / Doing / Blocked lists (global)
**Status**: Design validated, ready for implementation

## Overview

Add multi-select project filtering to the home view, allowing users to focus on specific projects while maintaining the global cross-project view as default. Filter state persists in URL for bookmarkability and browser history support.

## User Experience

### Visual Layout

```
┌─────────────────────────────────────┐
│ Issues                              │
│ [Projects (3) ▼]  ← Filter control │
│ ┌─────────────────────────────────┐ │
│ │ Ready | Doing | Blocked | Done  │ │
│ └─────────────────────────────────┘ │
│ [Issue list filtered by selection] │
└─────────────────────────────────────┘
```

### Filter Interaction Flow

1. Click "All Projects" or "Projects (n)" button
2. Popover opens with searchable project list
3. Check/uncheck projects (updates immediately, popover stays open)
4. Click outside or press Escape to close
5. URL updates with selected project IDs
6. Issue lists refresh to show only selected projects

### URL Structure

- All projects: `/` or `/?projects=`
- Single project: `/?projects=uuid1`
- Multiple projects: `/?projects=uuid1,uuid2,uuid3`

### Filter Display States

- No selection: "All Projects"
- 1+ selections: "Projects (n)" where n is count

## Technical Design

### Part 1: Data Loading & URL State Management

**Server-side** (`src/routes/(protected)/+page.server.ts`):

```typescript
export const load: PageServerLoad = async ({ locals, url }) => {
  // 1. Parse projects query param
  const projectsParam = url.searchParams.get('projects');
  const selectedProjectIds = projectsParam
    ? projectsParam.split(',').filter((id) => id.length > 0)
    : [];

  // 2. Build issues query
  let issuesQuery = locals.supabase.from('issues').select(`
      *,
      project:projects(*),
      epic:epics(*),
      milestone:milestones(*),
      // ... rest of relations
    `);

  // 3. Apply project filter if specified
  if (selectedProjectIds.length > 0) {
    issuesQuery = issuesQuery.in('project_id', selectedProjectIds);
  }

  const { data: issues, error } = await issuesQuery.order('sort_order', { ascending: true });

  // 4. Load projects for filter dropdown
  const { data: projects } = await locals.supabase
    .from('projects')
    .select('id, name')
    .order('name', { ascending: true });

  // 5. Load epics and milestones (unchanged)
  // ...

  return {
    issues: issues || [],
    projects: projects || [],
    epics: epics || [],
    milestones: milestones || [],
    selectedProjectIds, // Pass to client for filter state
  };
};
```

**Benefits**:

- Server-side filtering reduces data transfer (mobile-friendly)
- URL-based state enables bookmarking and sharing
- Backward compatible (no param = all projects)
- RLS policies automatically filter out unauthorized projects

### Part 2: Filter Component UI

**New component** (`src/lib/components/ProjectFilter.svelte`):

```typescript
// Props
export let projects: Array<{ id: string; name: string }>;
export let selectedProjectIds: string[];

// Local state
let open = false;
let searchQuery = '';

// Filtered projects based on search
$: filteredProjects = projects.filter((p) =>
  p.name.toLowerCase().includes(searchQuery.toLowerCase()),
);

// Display text for trigger button
$: buttonText =
  selectedProjectIds.length === 0 ? 'All Projects' : `Projects (${selectedProjectIds.length})`;
```

**Component structure**:

- Uses `Popover` from shadcn/svelte (trigger + content)
- Uses `Command` from shadcn/svelte (searchable list)
- Checkboxes for each project
- Search input at top of popover

**Accessibility**:

- Keyboard navigation (arrow keys, Enter to toggle, Escape to close)
- Focus management (returns to trigger on close)
- ARIA labels for screen readers

### Part 3: URL Synchronization

**Client-side navigation** (within `ProjectFilter.svelte`):

```typescript
import { goto } from '$app/navigation';
import { page } from '$app/stores';

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
```

**SvelteKit reactivity**:

- URL change triggers `+page.server.ts` load function automatically
- Page data updates with filtered issues
- Stores (`$readyIssues`, etc.) recompute based on new data
- No manual fetching needed

**Edge cases handled**:

- Invalid UUIDs in URL → filtered out during query (no match = no data)
- Projects user doesn't own → RLS policies prevent access
- Malformed query string → falls back to empty array (all projects)
- Empty selection → clean URL with no query params

### Part 4: Implementation Details

**Computed stores** (`src/lib/stores/computed.ts`):

- No changes needed
- Already derive from `issues` store
- Fewer issues to process when filtered = better performance

**Mobile considerations**:

- Popover is touch-friendly (shadcn handles tap targets)
- Search input helps with long project lists
- Scrollable checkbox list for many projects
- Close on backdrop tap (standard mobile pattern)

**Performance**:

- Server-side filtering reduces payload size
- Client-side stores recompute only when data changes
- Search is client-side (fast for typical project counts)

## Testing Strategy (TDD)

### Unit Tests

**URL parsing** (`tests/unit/utils/url-helpers.test.ts`):

```typescript
describe('parseProjectIds', () => {
  it('returns empty array for null param', () => {
    expect(parseProjectIds(null)).toEqual([]);
  });

  it('splits comma-separated UUIDs', () => {
    const ids = 'uuid1,uuid2,uuid3';
    expect(parseProjectIds(ids)).toEqual(['uuid1', 'uuid2', 'uuid3']);
  });

  it('filters out empty strings', () => {
    expect(parseProjectIds('uuid1,,uuid2')).toEqual(['uuid1', 'uuid2']);
  });
});
```

### Integration Tests

**Server load function** (`tests/integration/server/home-load.test.ts`):

```typescript
describe('Home page load', () => {
  it('returns all issues when no projects param', async () => {
    const result = await load({ url: new URL('http://localhost/') });
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it('filters issues by single project', async () => {
    const url = new URL('http://localhost/?projects=project-uuid');
    const result = await load({ url });
    expect(result.issues.every((i) => i.project_id === 'project-uuid')).toBe(true);
  });

  it('filters issues by multiple projects', async () => {
    const url = new URL('http://localhost/?projects=uuid1,uuid2');
    const result = await load({ url });
    const projectIds = result.issues.map((i) => i.project_id);
    expect(projectIds.every((id) => ['uuid1', 'uuid2'].includes(id))).toBe(true);
  });
});
```

### Component Tests

**ProjectFilter component** (`tests/component/ProjectFilter.test.ts`):

```typescript
describe('ProjectFilter', () => {
  it('displays "All Projects" when no selection', () => {
    render(ProjectFilter, { projects: [], selectedProjectIds: [] });
    expect(screen.getByText('All Projects')).toBeInTheDocument();
  });

  it('displays count when projects selected', () => {
    render(ProjectFilter, {
      projects: mockProjects,
      selectedProjectIds: ['uuid1', 'uuid2'],
    });
    expect(screen.getByText('Projects (2)')).toBeInTheDocument();
  });

  it('updates URL when project toggled', async () => {
    const { component } = render(ProjectFilter, {
      projects: mockProjects,
      selectedProjectIds: [],
    });

    await userEvent.click(screen.getByText('Project A'));

    expect(goto).toHaveBeenCalledWith(
      '/?projects=project-a-uuid',
      expect.objectContaining({ replaceState: false }),
    );
  });

  it('filters projects by search query', async () => {
    render(ProjectFilter, { projects: mockProjects, selectedProjectIds: [] });

    const searchInput = screen.getByPlaceholderText('Search projects...');
    await userEvent.type(searchInput, 'Alpha');

    expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    expect(screen.queryByText('Project Beta')).not.toBeInTheDocument();
  });
});
```

### E2E Tests

**Critical flow** (`tests/e2e/project-filtering.test.ts`):

```typescript
test('filter issues by projects', async ({ page }) => {
  await page.goto('/');

  // 1. Verify all projects shown initially
  await expect(page.getByText('All Projects')).toBeVisible();
  const allIssuesCount = await page.locator('[data-testid="issue-row"]').count();

  // 2. Open filter and select a project
  await page.click('text=All Projects');
  await page.click('text=Project Alpha');

  // 3. Verify URL updated
  expect(page.url()).toContain('projects=');

  // 4. Verify filtered issues shown
  await expect(page.getByText('Projects (1)')).toBeVisible();
  const filteredCount = await page.locator('[data-testid="issue-row"]').count();
  expect(filteredCount).toBeLessThan(allIssuesCount);

  // 5. Verify browser back works
  await page.goBack();
  await expect(page.getByText('All Projects')).toBeVisible();
  const backCount = await page.locator('[data-testid="issue-row"]').count();
  expect(backCount).toBe(allIssuesCount);
});
```

## Implementation Checklist

Following TDD red-green-refactor cycle:

- [ ] **RED**: Write failing tests for URL parsing helper
- [ ] **GREEN**: Implement URL parsing logic
- [ ] **REFACTOR**: Clean up parsing function

- [ ] **RED**: Write failing tests for server load with project filtering
- [ ] **GREEN**: Update `+page.server.ts` to filter by projects param
- [ ] **REFACTOR**: Extract query building logic if needed

- [ ] **RED**: Write failing component tests for ProjectFilter
- [ ] **GREEN**: Implement ProjectFilter.svelte component
- [ ] **REFACTOR**: Extract reusable filter logic

- [ ] **RED**: Write failing tests for URL synchronization
- [ ] **GREEN**: Implement toggleProject and updateURL functions
- [ ] **REFACTOR**: Simplify state management

- [ ] **RED**: Write E2E test for full filtering flow
- [ ] **GREEN**: Verify all pieces work together
- [ ] **REFACTOR**: Final polish and optimization

- [ ] Add projects query to server load function
- [ ] Integrate ProjectFilter into home page layout
- [ ] Manual testing on mobile device
- [ ] Verify browser back/forward works correctly

## Acceptance Criteria

From issue requirements:

✅ **Global lists across projects** - Default shows all projects, filter narrows scope
✅ **Tapping an issue opens drawer** - Unchanged, existing behavior preserved
✅ **Works smoothly on mobile** - URL-based state, touch-friendly popover, server-side filtering

Additional criteria from design:

✅ **URL reflects filter state** - Bookmarkable, shareable, browser history works
✅ **Live filtering** - Checkbox changes update immediately
✅ **Searchable project list** - Find projects quickly as count grows
✅ **Clear visual feedback** - "Projects (n)" shows active filter state

## Out of Scope

- Project sorting/grouping options
- Saved filter presets
- Project color coding or icons
- Filter by epic or milestone (future enhancement)
- "Clear all" button (unchecking all achieves same result)

## Future Enhancements

Potential improvements after MVP:

- Remember last filter selection in localStorage (in addition to URL)
- Keyboard shortcuts to toggle specific projects (⌘1, ⌘2, etc.)
- Project groups/categories for better organization
- Filter by multiple dimensions (project + epic + milestone)
- Visual indicator in issue rows showing which project they belong to
