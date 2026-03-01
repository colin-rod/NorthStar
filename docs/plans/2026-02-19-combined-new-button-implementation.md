# Combined "New..." Button Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace separate "New Issue" and "New Project" buttons with a single dropdown button

**Architecture:** Create a self-contained `NewButtonDropdown.svelte` component using shadcn/svelte Popover. Add `projectSheetOpen` store to existing `issues.ts` stores. Component triggers sheet opens via stores.

**Tech Stack:** SvelteKit, Svelte 5 (runes), shadcn/svelte Popover, Writable stores

---

## Task 1: Add Project Sheet Store

**Files:**

- Modify: `src/lib/stores/issues.ts`
- Test: N/A (simple store addition, will be tested via component tests)

**Step 1: Add projectSheetOpen store and helper functions**

Add to `src/lib/stores/issues.ts` after the `isIssueSheetOpen` store (around line 40):

```typescript
/**
 * Project sheet open state
 */
export const projectSheetOpen: Writable<boolean> = writable(false);

/**
 * Helper function to open project sheet in create mode
 */
export function openCreateProjectSheet() {
  projectSheetOpen.set(true);
}

/**
 * Helper function to close project sheet
 */
export function closeProjectSheet() {
  projectSheetOpen.set(false);
}
```

**Step 2: Verify the file compiles**

Run: `npm run check`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/lib/stores/issues.ts
git commit -m "feat: add projectSheetOpen store for New button dropdown

Add store to manage project creation sheet visibility, matching existing
pattern for issue sheet management.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Create NewButtonDropdown Component (TDD - Write Test)

**Files:**

- Create: `tests/component/NewButtonDropdown.test.ts`

**Step 1: Write failing component tests**

Create `tests/component/NewButtonDropdown.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import NewButtonDropdown from '$lib/components/NewButtonDropdown.svelte';
import { get } from 'svelte/store';
import { isIssueSheetOpen, projectSheetOpen } from '$lib/stores/issues';

describe('NewButtonDropdown', () => {
  beforeEach(() => {
    // Reset stores before each test
    isIssueSheetOpen.set(false);
    projectSheetOpen.set(false);
  });

  it('renders button with "New..." text and chevron icon', () => {
    render(NewButtonDropdown);
    const button = screen.getByRole('button', { name: /new/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('New...');
  });

  it('opens popover menu when button is clicked', async () => {
    render(NewButtonDropdown);
    const button = screen.getByRole('button', { name: /new/i });

    await fireEvent.click(button);

    // Menu should be visible
    expect(screen.getByText('New Issue')).toBeInTheDocument();
    expect(screen.getByText('New Project')).toBeInTheDocument();
  });

  it('shows menu options in correct order: Issue then Project', async () => {
    render(NewButtonDropdown);
    const button = screen.getByRole('button', { name: /new/i });

    await fireEvent.click(button);

    const menuItems = screen.getAllByRole('menuitem');
    expect(menuItems).toHaveLength(2);
    expect(menuItems[0]).toHaveTextContent('New Issue');
    expect(menuItems[1]).toHaveTextContent('New Project');
  });

  it('sets isIssueSheetOpen to true when "New Issue" is clicked', async () => {
    render(NewButtonDropdown);
    const button = screen.getByRole('button', { name: /new/i });

    await fireEvent.click(button);
    const newIssueOption = screen.getByText('New Issue');
    await fireEvent.click(newIssueOption);

    expect(get(isIssueSheetOpen)).toBe(true);
  });

  it('sets projectSheetOpen to true when "New Project" is clicked', async () => {
    render(NewButtonDropdown);
    const button = screen.getByRole('button', { name: /new/i });

    await fireEvent.click(button);
    const newProjectOption = screen.getByText('New Project');
    await fireEvent.click(newProjectOption);

    expect(get(projectSheetOpen)).toBe(true);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm run test tests/component/NewButtonDropdown.test.ts`
Expected: All tests FAIL with "NewButtonDropdown.svelte not found"

**Step 3: Commit**

```bash
git add tests/component/NewButtonDropdown.test.ts
git commit -m "test: add failing tests for NewButtonDropdown component

Tests verify:
- Button renders with correct text and icon
- Menu opens on click with correct options in order
- Clicking options sets appropriate stores

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Implement NewButtonDropdown Component (TDD - Make Tests Pass)

**Files:**

- Create: `src/lib/components/NewButtonDropdown.svelte`

**Step 1: Create minimal component to pass tests**

Create `src/lib/components/NewButtonDropdown.svelte`:

```svelte
<script lang="ts">
  import { Popover, PopoverTrigger, PopoverContent } from '$lib/components/ui/popover';
  import { Button } from '$lib/components/ui/button';
  import { ChevronDown } from 'lucide-svelte';
  import { isIssueSheetOpen, projectSheetOpen } from '$lib/stores/issues';

  let open = $state(false);

  function handleNewIssue() {
    isIssueSheetOpen.set(true);
    open = false;
  }

  function handleNewProject() {
    projectSheetOpen.set(true);
    open = false;
  }
</script>

<Popover bind:open>
  <PopoverTrigger asChild let:builder>
    <Button builders={[builder]} class="bg-primary hover:bg-primary-hover text-white">
      New...
      <ChevronDown class="ml-2 h-4 w-4" />
    </Button>
  </PopoverTrigger>
  <PopoverContent align="end" class="w-[160px] p-1">
    <button
      role="menuitem"
      onclick={handleNewIssue}
      class="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      New Issue
    </button>
    <button
      role="menuitem"
      onclick={handleNewProject}
      class="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      New Project
    </button>
  </PopoverContent>
</Popover>
```

**Step 2: Run tests to verify they pass**

Run: `npm run test tests/component/NewButtonDropdown.test.ts`
Expected: All tests PASS

**Step 3: Run type checking**

Run: `npm run check`
Expected: No TypeScript errors

**Step 4: Commit**

```bash
git add src/lib/components/NewButtonDropdown.svelte
git commit -m "feat: implement NewButtonDropdown component

Self-contained dropdown button using Popover component. Opens issue or
project sheets via stores. Mobile-friendly click interaction.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Integrate with ProjectDetailSheet

**Files:**

- Modify: `src/routes/(protected)/projects/+page.svelte:490-499`

**Step 1: Update ProjectDetailSheet to bind to projectSheetOpen store**

In `src/routes/(protected)/projects/+page.svelte`, find the ProjectDetailSheet component (around line 490):

Replace:

```svelte
<!-- Project detail sheet (handles both create and edit) -->
<ProjectDetailSheet
  bind:open={projectDetailSheetOpen}
  mode={projectDetailSheetMode}
  project={selectedProjectForDetail}
  counts={selectedProjectCounts}
  metrics={selectedProjectMetrics}
  epics={selectedProjectEpics}
  userId={data.session?.user?.id ?? ''}
/>
```

With:

```svelte
<!-- Project detail sheet (handles both create and edit) -->
<ProjectDetailSheet
  bind:open={projectDetailSheetOpen}
  mode={projectDetailSheetMode}
  project={selectedProjectForDetail}
  counts={selectedProjectCounts}
  metrics={selectedProjectMetrics}
  epics={selectedProjectEpics}
  userId={data.session?.user?.id ?? ''}
/>
```

**Step 2: Add effect to sync store with local state**

In `src/routes/(protected)/projects/+page.svelte`, add after the component-local state declarations (around line 72):

```typescript
import { projectSheetOpen } from '$lib/stores/issues';

// Sync store with local state for project sheet
$effect(() => {
  if ($projectSheetOpen && !projectDetailSheetOpen) {
    // Store requested open - trigger create mode
    openProjectSheetForCreate();
  }
});

// Sync local state back to store when sheet closes
$effect(() => {
  if (!projectDetailSheetOpen && $projectSheetOpen) {
    projectSheetOpen.set(false);
  }
});
```

**Step 3: Verify compilation**

Run: `npm run check`
Expected: No TypeScript errors

**Step 4: Commit**

```bash
git add src/routes/\(protected\)/projects/+page.svelte
git commit -m "feat: sync projectSheetOpen store with ProjectDetailSheet

Add bidirectional sync between global store and local sheet state,
enabling NewButtonDropdown to trigger project creation.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Replace Buttons on Projects Page

**Files:**

- Modify: `src/routes/(protected)/projects/+page.svelte:444-462`

**Step 1: Import NewButtonDropdown**

Add to imports at top of `src/routes/(protected)/projects/+page.svelte`:

```typescript
import NewButtonDropdown from '$lib/components/NewButtonDropdown.svelte';
```

**Step 2: Replace button section**

Find the buttons section (around line 447):

Replace:

```svelte
<div class="flex items-center justify-between">
  <h1 class="font-accent text-page-title">Projects</h1>
  <div class="flex gap-2">
    <Button
      onclick={openCreateIssueSheet}
      variant="outline"
      class="border-primary text-primary hover:bg-primary/10"
    >
      New Issue
    </Button>
    <Button
      onclick={openProjectSheetForCreate}
      class="bg-primary hover:bg-primary-hover text-white"
    >
      New Project
    </Button>
  </div>
</div>
```

With:

```svelte
<div class="flex items-center justify-between">
  <h1 class="font-accent text-page-title">Projects</h1>
  <NewButtonDropdown />
</div>
```

**Step 3: Test manually in browser**

Run: `npm run dev`
Navigate to: http://localhost:5173/projects
Expected:

- Single "New..." button appears in top right
- Clicking button opens dropdown menu
- Menu shows "New Issue" and "New Project"
- Clicking "New Issue" opens IssueSheet
- Clicking "New Project" opens ProjectDetailSheet

**Step 4: Commit**

```bash
git add src/routes/\(protected\)/projects/+page.svelte
git commit -m "feat: replace separate buttons with NewButtonDropdown on projects page

Remove old \"New Issue\" and \"New Project\" buttons, replace with unified
dropdown. Cleaner UI, same functionality.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Replace Button on Home Page

**Files:**

- Modify: `src/routes/(protected)/+page.svelte:111-115`

**Step 1: Import NewButtonDropdown**

Add to imports at top of `src/routes/(protected)/+page.svelte`:

```typescript
import NewButtonDropdown from '$lib/components/NewButtonDropdown.svelte';
```

**Step 2: Import and add projectSheetOpen effect**

Add to imports:

```typescript
import { projectSheetOpen } from '$lib/stores/issues';
import ProjectDetailSheet from '$lib/components/ProjectDetailSheet.svelte';
```

Add local state for project sheet (after line 109):

```typescript
// Project sheet state (triggered by NewButtonDropdown)
let projectDetailSheetOpen = $state(false);

// Sync store with local state for project sheet
$effect(() => {
  if ($projectSheetOpen && !projectDetailSheetOpen) {
    projectDetailSheetOpen = true;
  }
});

// Sync local state back to store when sheet closes
$effect(() => {
  if (!projectDetailSheetOpen && $projectSheetOpen) {
    projectSheetOpen.set(false);
  }
});
```

**Step 3: Replace button in header**

Find the header section (around line 112):

Replace:

```svelte
<div class="flex items-center justify-between">
  <h1 class="font-accent text-page-title">Issues</h1>
  <Button onclick={openCreateIssueSheet}>+ New Issue</Button>
</div>
```

With:

```svelte
<div class="flex items-center justify-between">
  <h1 class="font-accent text-page-title">Issues</h1>
  <NewButtonDropdown />
</div>
```

**Step 4: Add ProjectDetailSheet component at end of file**

Add after the IssueSheet component (after line 169):

```svelte
<!-- Project Detail Sheet (for creation from home page) -->
<ProjectDetailSheet
  bind:open={projectDetailSheetOpen}
  mode="create"
  project={null}
  counts={null}
  metrics={null}
  epics={[]}
  userId={data.session?.user?.id ?? ''}
/>
```

**Step 5: Test manually in browser**

Run: `npm run dev`
Navigate to: http://localhost:5173
Expected:

- Single "New..." button appears in top right
- Clicking button opens dropdown menu
- Menu shows "New Issue" and "New Project"
- Clicking "New Issue" opens IssueSheet
- Clicking "New Project" opens ProjectDetailSheet in create mode

**Step 6: Commit**

```bash
git add src/routes/\(protected\)/+page.svelte
git commit -m "feat: replace New Issue button with NewButtonDropdown on home page

Add NewButtonDropdown and ProjectDetailSheet to home page. Users can now
create both issues and projects from home.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Manual QA Testing

**Files:** N/A

**Step 1: Test on home page**

Manual checklist:

- [ ] Button appears on home page
- [ ] Clicking button opens dropdown
- [ ] "New Issue" is first option
- [ ] "New Project" is second option
- [ ] Clicking "New Issue" opens IssueSheet
- [ ] Clicking "New Project" opens ProjectDetailSheet
- [ ] Creating issue works
- [ ] Creating project works
- [ ] Dropdown closes after selection
- [ ] Clicking outside dropdown closes it

**Step 2: Test on projects page**

Manual checklist:

- [ ] Button appears on projects page
- [ ] Clicking button opens dropdown
- [ ] "New Issue" is first option
- [ ] "New Project" is second option
- [ ] Clicking "New Issue" opens IssueSheet
- [ ] Clicking "New Project" opens ProjectDetailSheet
- [ ] Creating issue works
- [ ] Creating project works
- [ ] Dropdown closes after selection
- [ ] Clicking outside dropdown closes it

**Step 3: Test mobile responsiveness**

Use browser dev tools to simulate mobile:

- [ ] Button renders correctly on mobile
- [ ] Dropdown opens on touch
- [ ] Menu items are touch-friendly
- [ ] Sheets open as bottom drawers on mobile

**Step 4: Test keyboard accessibility**

- [ ] Tab focuses the button
- [ ] Enter/Space opens dropdown
- [ ] Arrow keys navigate menu items
- [ ] Enter selects menu item
- [ ] Escape closes dropdown

**Step 5: Document test results**

If all tests pass, proceed to final commit. If issues found, fix them before proceeding.

---

## Task 8: Run Full Test Suite

**Files:** N/A

**Step 1: Run all tests**

Run: `npm run test`
Expected: All tests pass (including new NewButtonDropdown tests)

**Step 2: Run type checking**

Run: `npm run check`
Expected: No TypeScript errors

**Step 3: Run linter**

Run: `npm run lint`
Expected: No linting errors

**Step 4: If any failures, fix them**

Address any test failures, type errors, or linting issues before proceeding.

**Step 5: Commit fixes if needed**

```bash
git add .
git commit -m "fix: address test/lint issues from combined button implementation

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Final Integration Testing

**Files:** N/A

**Step 1: Test full workflow on home page**

1. Navigate to home page
2. Click "New..." → "New Issue"
3. Create an issue with title "Test Issue from Home"
4. Verify issue appears in list
5. Click "New..." → "New Project"
6. Create a project with name "Test Project from Home"
7. Navigate to projects page
8. Verify project appears in list

**Step 2: Test full workflow on projects page**

1. Navigate to projects page
2. Click "New..." → "New Project"
3. Create a project with name "Test Project from Projects Page"
4. Verify project appears in tree
5. Click "New..." → "New Issue"
6. Create an issue with title "Test Issue from Projects Page"
7. Navigate to home page
8. Verify issue appears in list

**Step 3: Clean up test data**

Delete the test issues and projects created during testing.

**Step 4: Document completion**

Implementation is complete when all manual tests pass.

---

## Success Criteria

✅ Implementation is complete when:

1. Two separate buttons are replaced with single "New..." dropdown on both pages
2. Dropdown contains "New Issue" and "New Project" in correct order
3. Clicking each option opens the appropriate sheet
4. Button appears on home and projects pages only
5. All component tests pass
6. Manual testing checklist is complete
7. Old button code is removed
8. UI is mobile-friendly and keyboard accessible
9. Full test suite passes
10. No TypeScript or linting errors

---

## Notes

- Follow TDD: Write test first, make it pass, refactor if needed
- Keep commits small and focused
- Test after each task before proceeding
- Use existing patterns from the codebase (stores, sheets, components)
- The component is self-contained and requires no props
- State management uses existing store pattern from `issues.ts`
