# Blocked/Ready State Display Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Display blocking dependency counts on issue rows and group dependencies in issue detail view.

**Architecture:** Client-side computation using existing `getBlockingDependencies()` and `getSatisfiedDependencies()` helpers. Update IssueRow to show "Blocked (N)" badge and DependencyManagementSection to group blocking/satisfied dependencies with summary.

**Tech Stack:** SvelteKit, Svelte 5 runes, @testing-library/svelte, Vitest

---

## Task 1: IssueRow Component Tests

**Files:**

- Create: `tests/component/IssueRow.test.ts`

**Step 1: Write failing test for blocked count display**

```typescript
import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import IssueRow from '$lib/components/IssueRow.svelte';
import type { Issue } from '$lib/types';

describe('IssueRow - Blocked State Display', () => {
  it('should display "Blocked (2)" when issue has 2 blocking dependencies', () => {
    const issue: Issue = {
      id: '1',
      title: 'Test Issue',
      status: 'todo',
      priority: 0,
      project_id: 'proj-1',
      epic_id: 'epic-1',
      sort_order: 1,
      created_at: new Date().toISOString(),
      project: { id: 'proj-1', name: 'Test Project' },
      epic: { id: 'epic-1', name: 'Test Epic' },
      dependencies: [
        {
          issue_id: '1',
          depends_on_issue_id: 'dep-1',
          depends_on_issue: {
            id: 'dep-1',
            title: 'Dependency 1',
            status: 'todo',
            priority: 0,
            project_id: 'proj-1',
            epic_id: 'epic-1',
            sort_order: 1,
            created_at: new Date().toISOString(),
          },
        },
        {
          issue_id: '1',
          depends_on_issue_id: 'dep-2',
          depends_on_issue: {
            id: 'dep-2',
            title: 'Dependency 2',
            status: 'doing',
            priority: 0,
            project_id: 'proj-1',
            epic_id: 'epic-1',
            sort_order: 2,
            created_at: new Date().toISOString(),
          },
        },
      ],
    };

    render(IssueRow, { props: { issue } });

    expect(screen.getByText('Blocked (2)')).toBeInTheDocument();
  });

  it('should display "Blocked (1)" when issue has 1 blocking dependency', () => {
    const issue: Issue = {
      id: '1',
      title: 'Test Issue',
      status: 'todo',
      priority: 0,
      project_id: 'proj-1',
      epic_id: 'epic-1',
      sort_order: 1,
      created_at: new Date().toISOString(),
      project: { id: 'proj-1', name: 'Test Project' },
      epic: { id: 'epic-1', name: 'Test Epic' },
      dependencies: [
        {
          issue_id: '1',
          depends_on_issue_id: 'dep-1',
          depends_on_issue: {
            id: 'dep-1',
            title: 'Dependency 1',
            status: 'in_review',
            priority: 0,
            project_id: 'proj-1',
            epic_id: 'epic-1',
            sort_order: 1,
            created_at: new Date().toISOString(),
          },
        },
      ],
    };

    render(IssueRow, { props: { issue } });

    expect(screen.getByText('Blocked (1)')).toBeInTheDocument();
  });

  it('should NOT display blocked badge when issue has no blocking dependencies', () => {
    const issue: Issue = {
      id: '1',
      title: 'Test Issue',
      status: 'todo',
      priority: 0,
      project_id: 'proj-1',
      epic_id: 'epic-1',
      sort_order: 1,
      created_at: new Date().toISOString(),
      project: { id: 'proj-1', name: 'Test Project' },
      epic: { id: 'epic-1', name: 'Test Epic' },
      dependencies: [],
    };

    render(IssueRow, { props: { issue } });

    expect(screen.queryByText(/Blocked/)).not.toBeInTheDocument();
  });

  it('should NOT display blocked badge when all dependencies are satisfied', () => {
    const issue: Issue = {
      id: '1',
      title: 'Test Issue',
      status: 'todo',
      priority: 0,
      project_id: 'proj-1',
      epic_id: 'epic-1',
      sort_order: 1,
      created_at: new Date().toISOString(),
      project: { id: 'proj-1', name: 'Test Project' },
      epic: { id: 'epic-1', name: 'Test Epic' },
      dependencies: [
        {
          issue_id: '1',
          depends_on_issue_id: 'dep-1',
          depends_on_issue: {
            id: 'dep-1',
            title: 'Dependency 1',
            status: 'done',
            priority: 0,
            project_id: 'proj-1',
            epic_id: 'epic-1',
            sort_order: 1,
            created_at: new Date().toISOString(),
          },
        },
        {
          issue_id: '1',
          depends_on_issue_id: 'dep-2',
          depends_on_issue: {
            id: 'dep-2',
            title: 'Dependency 2',
            status: 'canceled',
            priority: 0,
            project_id: 'proj-1',
            epic_id: 'epic-1',
            sort_order: 2,
            created_at: new Date().toISOString(),
          },
        },
      ],
    };

    render(IssueRow, { props: { issue } });

    expect(screen.queryByText(/Blocked/)).not.toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test tests/component/IssueRow.test.ts`

Expected: FAIL - "Blocked (2)" not found (currently shows "Blocked" without count)

**Step 3: Update IssueRow component to show blocking count**

Modify: `src/lib/components/IssueRow.svelte:26` (add import)

```svelte
import {(isBlocked, getBlockingDependencies)} from '$lib/utils/issue-helpers';
```

Modify: `src/lib/components/IssueRow.svelte:59` (add blockingCount)

```svelte
// Compute blocked status let blocked = $derived(isBlocked(issue)); let blockingCount =
$derived(getBlockingDependencies(issue).length);
```

Modify: `src/lib/components/IssueRow.svelte:154-157` (update badge text)

```svelte
<!-- Blocked Indicator: amber dot with count -->
{#if blocked}
  <Badge variant="status-blocked" class="text-xs">Blocked ({blockingCount})</Badge>
{/if}
```

**Step 4: Run test to verify it passes**

Run: `npm run test tests/component/IssueRow.test.ts`

Expected: PASS - All 4 tests pass

**Step 5: Commit**

```bash
git add tests/component/IssueRow.test.ts src/lib/components/IssueRow.svelte
git commit -m "feat: display blocking dependency count in IssueRow

- Add getBlockingDependencies import to IssueRow
- Compute blockingCount using $derived
- Update badge to show 'Blocked (N)' format
- Add component tests for blocked count display

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: DependencyManagementSection Component Tests

**Files:**

- Create: `tests/component/DependencyManagementSection.test.ts`

**Step 1: Write failing test for blocking summary**

```typescript
import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import DependencyManagementSection from '$lib/components/DependencyManagementSection.svelte';
import type { Issue } from '$lib/types';

describe('DependencyManagementSection - Blocking Summary', () => {
  const createIssue = (id: string, title: string, status: string): Issue => ({
    id,
    title,
    status,
    priority: 0,
    project_id: 'proj-1',
    epic_id: 'epic-1',
    sort_order: 1,
    created_at: new Date().toISOString(),
    epic: { id: 'epic-1', name: 'Test Epic' },
  });

  it('should display "Blocked by 2 dependencies" when issue has 2 blocking deps', () => {
    const issue = createIssue('1', 'Test Issue', 'todo');
    const blockedByIssues = [
      createIssue('dep-1', 'Dependency 1', 'todo'),
      createIssue('dep-2', 'Dependency 2', 'doing'),
    ];

    render(DependencyManagementSection, {
      props: {
        issue,
        projectIssues: [],
        blockedByIssues,
        blockingIssues: [],
      },
    });

    expect(screen.getByText('🔒 Blocked by 2 dependencies')).toBeInTheDocument();
  });

  it('should display "Blocked by 1 dependency" (singular) when issue has 1 blocking dep', () => {
    const issue = createIssue('1', 'Test Issue', 'todo');
    const blockedByIssues = [createIssue('dep-1', 'Dependency 1', 'in_review')];

    render(DependencyManagementSection, {
      props: {
        issue,
        projectIssues: [],
        blockedByIssues,
        blockingIssues: [],
      },
    });

    expect(screen.getByText('🔒 Blocked by 1 dependency')).toBeInTheDocument();
  });

  it('should NOT display blocking summary when no blocking dependencies', () => {
    const issue = createIssue('1', 'Test Issue', 'todo');

    render(DependencyManagementSection, {
      props: {
        issue,
        projectIssues: [],
        blockedByIssues: [],
        blockingIssues: [],
      },
    });

    expect(screen.queryByText(/Blocked by/)).not.toBeInTheDocument();
  });

  it('should display "Satisfied dependencies" section when deps are done/canceled', () => {
    const issue = createIssue('1', 'Test Issue', 'todo');
    const blockedByIssues = [
      createIssue('dep-1', 'Dependency 1', 'done'),
      createIssue('dep-2', 'Dependency 2', 'canceled'),
    ];

    render(DependencyManagementSection, {
      props: {
        issue,
        projectIssues: [],
        blockedByIssues,
        blockingIssues: [],
      },
    });

    expect(screen.getByText('Satisfied dependencies')).toBeInTheDocument();
    expect(screen.getByText('Dependency 1')).toBeInTheDocument();
    expect(screen.getByText('Dependency 2')).toBeInTheDocument();
  });

  it('should group blocking and satisfied dependencies separately', () => {
    const issue = createIssue('1', 'Test Issue', 'todo');
    const blockedByIssues = [
      createIssue('dep-1', 'Blocking Dep 1', 'todo'),
      createIssue('dep-2', 'Blocking Dep 2', 'doing'),
      createIssue('dep-3', 'Satisfied Dep 1', 'done'),
      createIssue('dep-4', 'Satisfied Dep 2', 'canceled'),
    ];

    render(DependencyManagementSection, {
      props: {
        issue,
        projectIssues: [],
        blockedByIssues,
        blockingIssues: [],
      },
    });

    // Should show blocking summary
    expect(screen.getByText('🔒 Blocked by 2 dependencies')).toBeInTheDocument();

    // Should show satisfied section
    expect(screen.getByText('Satisfied dependencies')).toBeInTheDocument();

    // Should display all dependencies
    expect(screen.getByText('Blocking Dep 1')).toBeInTheDocument();
    expect(screen.getByText('Blocking Dep 2')).toBeInTheDocument();
    expect(screen.getByText('Satisfied Dep 1')).toBeInTheDocument();
    expect(screen.getByText('Satisfied Dep 2')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test tests/component/DependencyManagementSection.test.ts`

Expected: FAIL - Blocking summary and grouping not implemented

**Step 3: Update DependencyManagementSection to group dependencies**

Modify: `src/lib/components/DependencyManagementSection.svelte:1-9` (add imports)

```svelte
<script lang="ts">
  import type { Issue } from '$lib/types';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import AddDependencyDialog from '$lib/components/AddDependencyDialog.svelte';
  import X from '@lucide/svelte/icons/x';
  import { invalidateAll } from '$app/navigation';
  import { supabase } from '$lib/supabase';
  import { getBlockingDependencies, getSatisfiedDependencies } from '$lib/utils/issue-helpers';
```

Modify: `src/lib/components/DependencyManagementSection.svelte:10-23` (add derived state)

```svelte
  // Props
  let {
    issue,
    projectIssues = [],
    blockedByIssues = [],
    blockingIssues = [],
    saveError = $bindable<string | null>(null),
  }: {
    issue: Issue;
    projectIssues: Issue[];
    blockedByIssues: Issue[];
    blockingIssues: Issue[];
    saveError?: string | null;
  } = $props();

  // Compute blocking vs satisfied dependencies
  let blockingDeps = $derived(
    blockedByIssues.filter((dep) => dep.status !== 'done' && dep.status !== 'canceled'),
  );
  let satisfiedDeps = $derived(
    blockedByIssues.filter((dep) => dep.status === 'done' || dep.status === 'canceled'),
  );
```

Modify: `src/lib/components/DependencyManagementSection.svelte:79-113` (update template)

```svelte
<section>
  <h3 class="text-xs uppercase font-medium text-foreground-muted mb-3 tracking-wide">
    Dependencies
  </h3>
  <div class="space-y-4">
    <!-- Blocking Summary -->
    {#if blockingDeps.length > 0}
      <div class="text-sm text-destructive font-medium mb-2">
        🔒 Blocked by {blockingDeps.length}
        {blockingDeps.length === 1 ? 'dependency' : 'dependencies'}
      </div>
    {/if}

    <!-- Blocking Dependencies -->
    {#if blockingDeps.length > 0}
      <div>
        <p class="text-metadata text-foreground-muted mb-2">Blocked by:</p>
        <div class="space-y-2">
          {#each blockingDeps as dep (dep.id)}
            <div class="group flex items-center gap-2 p-2 rounded-md bg-muted/50">
              <Badge variant={getStatusVariant(dep.status)} class="shrink-0">
                {formatStatus(dep.status)}
              </Badge>
              <span class="text-body flex-1 truncate">{dep.title}</span>
              <span class="text-metadata text-foreground-muted shrink-0">
                {dep.epic?.name}
              </span>
              <button
                type="button"
                onclick={() => removeDependency(dep.id)}
                class="shrink-0 text-foreground-muted hover:text-destructive transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
                aria-label="Remove dependency"
              >
                <X class="h-4 w-4" />
              </button>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Satisfied Dependencies -->
    {#if satisfiedDeps.length > 0}
      <div>
        <p class="text-metadata text-foreground-muted mb-2">Satisfied dependencies</p>
        <div class="space-y-2">
          {#each satisfiedDeps as dep (dep.id)}
            <div class="group flex items-center gap-2 p-2 rounded-md bg-muted/50">
              <Badge variant={getStatusVariant(dep.status)} class="shrink-0">
                {formatStatus(dep.status)}
              </Badge>
              <span class="text-body flex-1 truncate">{dep.title}</span>
              <span class="text-metadata text-foreground-muted shrink-0">
                {dep.epic?.name}
              </span>
              <button
                type="button"
                onclick={() => removeDependency(dep.id)}
                class="shrink-0 text-foreground-muted hover:text-destructive transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
                aria-label="Remove dependency"
              >
                <X class="h-4 w-4" />
              </button>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- No dependencies message -->
    {#if blockedByIssues.length === 0}
      <p class="text-metadata text-foreground-muted">No blocking dependencies</p>
    {/if}
```

**Step 4: Run test to verify it passes**

Run: `npm run test tests/component/DependencyManagementSection.test.ts`

Expected: PASS - All 5 tests pass

**Step 5: Commit**

```bash
git add tests/component/DependencyManagementSection.test.ts src/lib/components/DependencyManagementSection.svelte
git commit -m "feat: group blocking and satisfied dependencies in detail view

- Add getBlockingDependencies/getSatisfiedDependencies imports
- Compute blockingDeps and satisfiedDeps using $derived
- Display blocking summary: 'Blocked by N dependencies'
- Group blocking deps first, then satisfied deps
- Add component tests for dependency grouping

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Manual Verification

**Files:**

- None (manual testing)

**Step 1: Start development server**

Run: `npm run dev`

Expected: Server starts on http://localhost:5173

**Step 2: Verify IssueRow blocked count**

1. Navigate to Home page (/)
2. Find an issue with blocking dependencies
3. Verify badge shows "Blocked (N)" where N is the count

Expected: Badge displays count correctly

**Step 3: Verify DependencyManagementSection grouping**

1. Click on a blocked issue to open IssueSheet
2. Scroll to Dependencies section
3. Verify blocking summary appears: "🔒 Blocked by N dependencies"
4. Verify blocking deps listed first under "Blocked by:"
5. If satisfied deps exist, verify "Satisfied dependencies" section appears below

Expected: Dependencies grouped correctly with summary

**Step 4: Verify Ready tab filtering**

1. Navigate to Home page (/)
2. Click "Ready" tab
3. Verify only todo issues without blocking deps appear
4. Click "Blocked" tab
5. Verify all issues with blocking deps appear (any status)

Expected: Tab filtering works correctly

**Step 5: Verify state update after dependency status change**

1. Open a blocked issue in IssueSheet
2. Note the blocking count
3. Open one of the blocking dependencies
4. Change its status to "done"
5. Refresh the page
6. Return to original issue
7. Verify blocking count decreased by 1

Expected: Blocked count updates after refresh

---

## Task 4: Integration Test (Optional Enhancement)

**Files:**

- Create: `tests/integration/blocked-ready-filtering.test.ts`

**Step 1: Write integration test for tab filtering**

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

describe('Blocked/Ready Tab Filtering', () => {
  const supabaseUrl = process.env.PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY!;
  const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

  let testProjectId: string;
  let testEpicId: string;
  let readyIssueId: string;
  let blockedIssueId: string;
  let blockingIssueId: string;

  beforeAll(async () => {
    // Create test project and epic
    const { data: project } = await supabase
      .from('projects')
      .insert({ name: 'Test - Blocked Ready Filtering' })
      .select()
      .single();
    testProjectId = project!.id;

    const { data: epic } = await supabase
      .from('epics')
      .select('id')
      .eq('project_id', testProjectId)
      .eq('is_default', true)
      .single();
    testEpicId = epic!.id;

    // Create ready issue (todo, no deps)
    const { data: readyIssue } = await supabase
      .from('issues')
      .insert({
        title: 'Ready Issue',
        project_id: testProjectId,
        epic_id: testEpicId,
        status: 'todo',
        priority: 0,
      })
      .select()
      .single();
    readyIssueId = readyIssue!.id;

    // Create blocking issue (todo, will be dependency)
    const { data: blockingIssue } = await supabase
      .from('issues')
      .insert({
        title: 'Blocking Issue',
        project_id: testProjectId,
        epic_id: testEpicId,
        status: 'todo',
        priority: 0,
      })
      .select()
      .single();
    blockingIssueId = blockingIssue!.id;

    // Create blocked issue (todo, depends on blocking issue)
    const { data: blockedIssue } = await supabase
      .from('issues')
      .insert({
        title: 'Blocked Issue',
        project_id: testProjectId,
        epic_id: testEpicId,
        status: 'todo',
        priority: 0,
      })
      .select()
      .single();
    blockedIssueId = blockedIssue!.id;

    // Create dependency
    await supabase.from('dependencies').insert({
      issue_id: blockedIssueId,
      depends_on_issue_id: blockingIssueId,
    });
  });

  afterAll(async () => {
    // Cleanup
    await supabase.from('projects').delete().eq('id', testProjectId);
  });

  it('should identify ready issue correctly', async () => {
    const { data: issue } = await supabase
      .from('issues')
      .select('*, dependencies(depends_on_issue_id, depends_on_issue:issues(*))')
      .eq('id', readyIssueId)
      .single();

    // Issue should be ready: status=todo and no blocking deps
    expect(issue!.status).toBe('todo');
    expect(issue!.dependencies).toHaveLength(0);
  });

  it('should identify blocked issue correctly', async () => {
    const { data: issue } = await supabase
      .from('issues')
      .select('*, dependencies(depends_on_issue_id, depends_on_issue:issues(*))')
      .eq('id', blockedIssueId)
      .single();

    // Issue should be blocked: has dependency with status=todo
    expect(issue!.status).toBe('todo');
    expect(issue!.dependencies).toHaveLength(1);
    expect(issue!.dependencies[0].depends_on_issue.status).toBe('todo');
  });

  it('should unblock issue when dependency is marked done', async () => {
    // Mark blocking issue as done
    await supabase.from('issues').update({ status: 'done' }).eq('id', blockingIssueId);

    // Re-fetch blocked issue
    const { data: issue } = await supabase
      .from('issues')
      .select('*, dependencies(depends_on_issue_id, depends_on_issue:issues(*))')
      .eq('id', blockedIssueId)
      .single();

    // Issue should now be ready: dependency is done
    expect(issue!.dependencies[0].depends_on_issue.status).toBe('done');
  });
});
```

**Step 2: Run integration test**

Run: `npm run test:integration tests/integration/blocked-ready-filtering.test.ts`

Expected: PASS - All 3 tests pass

**Step 3: Commit**

```bash
git add tests/integration/blocked-ready-filtering.test.ts
git commit -m "test: add integration tests for blocked/ready filtering

- Test ready issue identification (todo + no blocking deps)
- Test blocked issue identification (todo + blocking deps)
- Test state update when dependency marked done

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Final Verification and Documentation

**Files:**

- Modify: `docs/plans/2026-02-12-blocked-ready-state-display-design.md`

**Step 1: Run all tests**

Run: `npm run test`

Expected: All tests pass

**Step 2: Run type checking**

Run: `npm run check`

Expected: No type errors

**Step 3: Update design document with implementation status**

Modify line 5:

```markdown
**Status:** ✅ Implemented
```

**Step 4: Commit documentation update**

```bash
git add docs/plans/2026-02-12-blocked-ready-state-display-design.md
git commit -m "docs: mark blocked/ready state display as implemented

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

**Step 5: Verify all acceptance criteria**

Review the design document acceptance criteria:

- [x] Issue rows show "Blocked (N)" badge with accurate count
- [x] Ready issues have no explicit badge (clean UI)
- [x] Issue detail shows blocking summary and grouped dependencies
- [x] Ready tab contains only todo issues without blocking dependencies
- [x] Blocked tab contains all issues with blocking dependencies
- [x] Changing prerequisite status updates blocked state (after refresh)
- [x] All tests pass (unit, component, integration)

---

## Success Criteria Checklist

- [ ] IssueRow displays "Blocked (N)" with correct count
- [ ] No "Ready" badge shown (UI stays clean)
- [ ] DependencyManagementSection shows blocking summary
- [ ] Blocking dependencies listed first, satisfied deps second
- [ ] Ready tab filters correctly (todo + not blocked)
- [ ] Blocked tab shows all blocked issues
- [ ] All component tests pass
- [ ] Integration tests pass (optional)
- [ ] Type checking passes
- [ ] Manual verification complete

---

## Notes

- Component tests use `@testing-library/svelte` for Svelte 5 compatibility
- Integration tests are optional but recommended for comprehensive coverage
- Manual verification is critical for visual/UX validation
- All changes follow TDD: tests first, implementation second
- Frequent commits with clear messages
- DRY: Reuse existing helpers (`getBlockingDependencies`, `getSatisfiedDependencies`)
- YAGNI: No server-side computation, no real-time updates (not needed for MVP)
