# Combined "New..." Button Design

**Date:** 2026-02-19
**Status:** Approved

## Overview

Replace the two separate "New Issue" and "New Project" buttons with a single dropdown button that offers both options. This declutters the UI while maintaining quick access to the two primary creation actions.

## Motivation

The current UI has two separate buttons ("New Issue" and "New Project") positioned side-by-side in the top-right area. Combining them into a single dropdown:

- Reduces visual clutter
- Follows common patterns (GitHub, Linear, etc.)
- Maintains equal emphasis on both actions
- Provides cleaner visual hierarchy

## Visual Design

**Button Appearance:**

- Single primary button styled with solid orange background and white text
- Label: "New..." with a down-chevron icon (▾) positioned on the right side
- Button dimensions match the current "New Project" button size
- Uses shadcn/svelte DropdownMenu or Popover component for the menu

**Dropdown Menu:**

- Appears below the button on click
- Contains two options in order:
  1. "New Issue" (most frequent action at top)
  2. "New Project"
- Standard menu item styling with hover states
- Closes when clicking outside or selecting an option

**Visual Example:**

```
┌─────────────┐
│ New...    ▾ │  ← Primary button (orange background)
└─────────────┘
      ↓ (click)
┌──────────────┐
│ New Issue    │
│ New Project  │
└──────────────┘
```

## Behavior

**Interaction Flow:**

1. User clicks "New..." button
2. Dropdown menu appears with "New Issue" and "New Project" options
3. User selects an option
4. Appropriate side drawer (Sheet) opens with creation form
5. Dropdown menu closes

**Sheet Opening:**

- "New Issue" → Opens `IssueSheet` with issue creation form
- "New Project" → Opens `ProjectSheet` with project creation form
- Each sheet is a separate component with its own form logic

**Menu Behavior:**

- Click to open, click outside or select option to close
- Mobile-friendly (no hover-based interactions)
- Keyboard accessible (arrow keys to navigate, Enter to select)

## Component Structure

**New Component: `NewButtonDropdown.svelte`**

Location: `src/lib/components/NewButtonDropdown.svelte`

Responsibilities:

- Render the "New..." button with chevron icon
- Manage dropdown open/closed state
- Render the menu with "New Issue" and "New Project" options
- Trigger the appropriate sheet to open via store updates

**State Management: `ui.ts` Store**

Location: `src/lib/stores/ui.ts`

```typescript
import { writable } from 'svelte/store';

export const issueSheetOpen = writable(false);
export const projectSheetOpen = writable(false);
```

**Store Usage:**

- `NewButtonDropdown` writes to stores when menu options are clicked
- `IssueSheet` and `ProjectSheet` bind to their respective stores
- Enables communication across component boundaries without prop drilling

## Placement

The `NewButtonDropdown` component will appear on:

- **Home page** (`src/routes/+page.svelte`)
- **Projects list page** (`src/routes/projects/+page.svelte`)

The button will **NOT** appear on:

- Individual project detail pages (`/projects/[id]`)
- Epic detail pages (`/epics/[id]`)
- Auth pages (`/auth/login`, `/auth/signup`)

**Rationale:** Detail pages have their own inline creation flows. Limiting scope keeps implementation simple and focused.

## Technical Implementation

**Component Dependencies:**

- shadcn/svelte `DropdownMenu` component (or `Popover` if preferred)
- `Button` component from shadcn/svelte
- Chevron icon (from lucide-svelte or similar)

**NewButtonDropdown Implementation:**

```svelte
<script>
  import { DropdownMenu } from '$lib/components/ui/dropdown-menu';
  import { Button } from '$lib/components/ui/button';
  import { ChevronDown } from 'lucide-svelte';
  import { issueSheetOpen, projectSheetOpen } from '$lib/stores/ui';

  function handleNewIssue() {
    issueSheetOpen.set(true);
  }

  function handleNewProject() {
    projectSheetOpen.set(true);
  }
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger asChild let:builder>
    <Button builders={[builder]} variant="default">
      New... <ChevronDown class="ml-2 h-4 w-4" />
    </Button>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content>
    <DropdownMenu.Item on:click={handleNewIssue}>New Issue</DropdownMenu.Item>
    <DropdownMenu.Item on:click={handleNewProject}>New Project</DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>
```

**Sheet Integration:**
Both `IssueSheet` and `ProjectSheet` need to subscribe to their stores:

```svelte
<script>
  import { Sheet } from '$lib/components/ui/sheet';
  import { issueSheetOpen } from '$lib/stores/ui';
</script>

<Sheet bind:open={$issueSheetOpen}>
  <SheetContent>
    <!-- Issue creation form -->
  </SheetContent>
</Sheet>
```

## Cleanup

**Remove Old Buttons:**

- Delete the existing "New Issue" and "New Project" button implementations from:
  - Home page (`src/routes/+page.svelte`)
  - Projects list page (`src/routes/projects/+page.svelte`)
- If these buttons have dedicated components, those can be removed as well
- Keep any form action handlers that those buttons were using (they'll still be needed by the sheets)

## Testing Strategy

Following TDD principles from CLAUDE.md:

### Component Tests

Test file: `tests/component/NewButtonDropdown.test.ts`

**Tests to write:**

1. Renders button with "New..." text and chevron icon
2. Clicking button opens dropdown menu
3. Menu shows both "New Issue" and "New Project" options in correct order
4. Clicking "New Issue" sets `issueSheetOpen` store to `true`
5. Clicking "New Project" sets `projectSheetOpen` store to `true`
6. Clicking outside the dropdown closes it
7. Keyboard navigation works (arrow keys, Enter to select)

### Integration Tests

Test file: `tests/integration/new-button-flow.test.ts`

**Tests to write:**

1. Verify `IssueSheet` opens when `issueSheetOpen` store is set to `true`
2. Verify `ProjectSheet` opens when `projectSheetOpen` store is set to `true`
3. Full flow: click button → select "New Issue" → sheet opens → form submits → sheet closes
4. Full flow: click button → select "New Project" → sheet opens → form submits → sheet closes

### Manual Testing Checklist

- [ ] Button appears on home page in correct location
- [ ] Button appears on projects page in correct location
- [ ] Button does NOT appear on project detail pages
- [ ] Button does NOT appear on epic detail pages
- [ ] Button does NOT appear on auth pages
- [ ] Dropdown opens/closes correctly on desktop
- [ ] Dropdown works on mobile (touch interactions)
- [ ] Both sheets open with correct forms
- [ ] IssueSheet form works as expected
- [ ] ProjectSheet form works as expected
- [ ] Keyboard accessibility (Tab, Arrow keys, Enter, Escape)
- [ ] Visual styling matches design system (orange primary button)

## Success Criteria

The implementation is complete when:

1. ✅ Two separate buttons are replaced with single "New..." dropdown
2. ✅ Dropdown contains "New Issue" and "New Project" in correct order
3. ✅ Clicking each option opens the appropriate sheet
4. ✅ Button appears on home and projects pages only
5. ✅ All component and integration tests pass
6. ✅ Manual testing checklist is complete
7. ✅ Old button code is removed
8. ✅ UI is mobile-friendly and keyboard accessible

## Future Enhancements (Out of Scope)

These are explicitly NOT included in this implementation:

- Context-aware options (e.g., showing "New Epic" on project detail pages)
- Adding more creation options to the dropdown
- Command palette integration (⌘K to open)
- Keyboard shortcuts for specific actions (e.g., ⌘I for new issue)
- Recent items or quick actions in the dropdown

## Implementation Notes

- Use TDD: Write failing tests first, then implement to make them pass
- Follow the Red-Green-Refactor cycle
- Keep the implementation minimal and focused
- No over-engineering or speculative features
- Match existing code style and patterns in the project
