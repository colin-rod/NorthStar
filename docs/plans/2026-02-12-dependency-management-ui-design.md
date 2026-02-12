# Dependency Management UI Design

**Date:** 2026-02-12
**Issue:** #51 - Dependency creation UI (search + add) in issue drawer
**Status:** Approved

## Overview

Add inline dependency management to IssueSheet with search-based addition and one-click removal. Enables users to add/remove "Blocked by" dependencies across all projects with cycle detection.

## Component Architecture

### New Components

**DependencyManagementSection.svelte**

- Replaces current Dependencies section (IssueSheet.svelte lines 452-505)
- Displays "Blocked by" and "Blocking" lists with removal buttons
- Contains "Add Dependency" button that opens modal
- Handles dependency removal with immediate feedback

**AddDependencyDialog.svelte**

- Modal dialog for searching and selecting issues
- Simple text search (filters by issue title)
- Shows filtered results from all projects
- Validates cycles before insertion
- Inline error display for cycle detection failures

### Integration with IssueSheet

```svelte
<DependencyManagementSection
  {issue}
  {allIssues}
  {blockedByIssues}
  {blockingIssues}
  bind:saveError
/>
```

Props already available in IssueSheet, no new data loading required.

## User Flows

### Adding a Dependency

1. User clicks "Add Dependency" button
2. Modal opens with search input and full issue list
3. User types to filter issues by title (client-side, instant)
4. User clicks an issue from results
5. System calls `check_dependency_cycle()` RPC function
6. If cycle detected: Show error inline, keep modal open
7. If valid: Insert into dependencies table, close modal, refresh view

### Removing a Dependency

1. User hovers over dependency row (desktop) or sees X button (mobile)
2. User clicks X button
3. System immediately deletes from dependencies table
4. View refreshes to show updated lists
5. No confirmation dialog (follows auto-save pattern)

## Search & Filtering

### Available Issues Filter

```typescript
const availableIssues = allIssues.filter(
  (i) =>
    i.id !== issue.id && // Can't depend on self
    !blockedByIssues.some((dep) => dep.id === i.id) && // Already blocking this issue
    !blockingIssues.some((block) => block.id === i.id), // This issue already blocks it
);
```

### Search Logic

- Client-side filtering: `issue.title.toLowerCase().includes(searchTerm.toLowerCase())`
- No debounce needed (small dataset: ≤500 issues per CLAUDE.md)
- Instant feedback as user types

### Result Display

Each result row shows:

- Priority badge (P0-P3, colored)
- Issue title
- Project name • Epic name (muted metadata text)
- Clickable entire row (no separate "Add" button)

## Cycle Detection & Error Handling

### Validation Flow

```typescript
async function addDependency(dependsOnIssueId: string) {
  loading = true;
  error = null;

  try {
    // 1. Check for cycles using DB function
    const { data: wouldCycle } = await supabase.rpc('check_dependency_cycle', {
      new_issue_id: issue.id,
      new_depends_on_id: dependsOnIssueId,
    });

    // 2. If cycle detected, show error (don't close)
    if (wouldCycle) {
      error = 'Cannot add: this would create a circular dependency';
      return;
    }

    // 3. Insert dependency
    await supabase.from('dependencies').insert({
      issue_id: issue.id,
      depends_on_issue_id: dependsOnIssueId,
    });

    // 4. Success: refresh and close
    await invalidateAll();
    open = false;
  } catch (err) {
    error = 'Failed to add dependency';
  } finally {
    loading = false;
  }
}
```

### Error States

**Cycle Detected:**

- Red banner at top of modal: "Cannot add: this would create a circular dependency"
- Modal stays open for user to try different issue
- Error clears when user types in search

**Insert Failure:**

- Generic error: "Failed to add dependency"
- Modal stays open, user can retry

**Loading State:**

- Disable search input and result list
- Show spinner on clicked result row
- Prevents double-clicks and race conditions

## Dependency Display & Removal

### UI Pattern

```
Dependencies
├─ Blocked by:
│  ├─ [Status] Issue title          Epic name [X]
│  └─ [Status] Another issue        Epic name [X]
├─ Blocking:
│  └─ [Status] Dependent issue      Epic name [X]
└─ [Add Dependency] button
```

### Removal Button Behavior

- **Desktop:** X button appears on hover (`md:opacity-0 md:group-hover:opacity-100`)
- **Mobile:** X button always visible (`opacity-100`)
- Color: Muted gray, hover to red (`hover:text-destructive`)
- Icon: X from lucide-svelte (4x4 size)

### Removal Implementation

```typescript
async function removeDependency(dependsOnIssueId: string) {
  try {
    await supabase
      .from('dependencies')
      .delete()
      .eq('issue_id', issue.id)
      .eq('depends_on_issue_id', dependsOnIssueId);

    await invalidateAll();
  } catch (err) {
    saveError = 'Failed to remove dependency';
    setTimeout(() => (saveError = null), 5000);
  }
}
```

Uses existing `saveError` state from IssueSheet for consistency.

## Testing Strategy (TDD)

### Unit Tests

1. **Cycle detection RPC** - Call `check_dependency_cycle()` with various scenarios
2. **Add dependency logic** - Mock Supabase, verify INSERT with correct IDs
3. **Remove dependency logic** - Mock Supabase, verify DELETE with correct WHERE clause
4. **Search filtering** - Verify client-side filter excludes self + existing dependencies
5. **Available issues filter** - Verify correct exclusions

### Component Tests

1. **DependencyManagementSection** - Render with test data, verify lists display
2. **AddDependencyDialog** - Test search input, result filtering, selection
3. **Integration** - Click "Add Dependency", verify modal opens with correct data
4. **Removal** - Click X button, verify delete call with correct params
5. **Error states** - Simulate cycle detection error, verify inline message

### Implementation Order (Red-Green-Refactor)

1. Write failing test for cycle detection
2. Implement cycle validation
3. Write failing test for add dependency
4. Implement add flow (dialog + insert)
5. Write failing test for remove dependency
6. Implement remove flow (X button + delete)
7. Write failing test for search filtering
8. Implement search UI and filtering
9. Refactor: Extract reusable components, cleanup

## Acceptance Criteria

- ✅ Can add dependencies via search and select
- ✅ Can remove dependencies via X button
- ✅ Works cross-project (searches all issues)
- ✅ Displays both "Blocked by" and "Blocking" lists
- ✅ Validates cycles before insertion
- ✅ Shows inline error when cycle detected
- ✅ Mobile-first: X always visible on mobile, hover on desktop
- ✅ Follows auto-save pattern (no confirmation for removal)
- ✅ Uses existing error toast infrastructure

## Design Principles Applied

**Simplicity First:**

- Simple text search (no advanced filters)
- Client-side filtering (no backend search API)
- No confirmation dialogs (quick removal)

**Mobile-First:**

- X button always visible on mobile
- Touch-friendly click targets (entire row selectable)
- Modal works well on small screens

**Surgical Changes:**

- Only modifies Dependencies section of IssueSheet
- Reuses existing error handling patterns
- No changes to database schema (uses existing tables/functions)

## Files Changed

```
src/lib/components/
├── DependencyManagementSection.svelte  (NEW)
├── AddDependencyDialog.svelte          (NEW)
└── IssueSheet.svelte                   (MODIFIED: lines 452-505)

tests/component/
├── DependencyManagementSection.test.ts (NEW)
└── AddDependencyDialog.test.ts         (NEW)
```

## Open Questions

None - design validated and approved.
