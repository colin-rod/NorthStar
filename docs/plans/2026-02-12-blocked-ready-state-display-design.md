# Blocked/Ready State Display Design

**Date:** 2026-02-12
**Issue:** Issue 5.4 - Compute "Blocked" + "Ready" states and expose on lists
**Status:** ✅ Implemented

## Overview

Enhance issue list views to display blocking status and dependency counts, making it immediately clear which issues are blocked and why.

## Requirements

From issue description:

- Implement blocking logic and show "Ready/Blocked" in lists
- Dependency is satisfied if prerequisite status in (`done`, `canceled`)
- Otherwise it blocks
- `in_review` is not satisfied (still blocks)

Deliverables:

- On issue rows: blocked indicator and/or blocked count
- Home view uses "Ready" as default

Acceptance criteria:

- Issue marked blocked when any prereq not done/canceled
- Ready list shows todo + not blocked
- Changing prerequisite status updates dependent's blocked state

## Design Decisions

### 1. Display Locations

**IssueRow (in lists):**

- Show "Blocked (N)" badge where N is count of blocking dependencies
- No explicit "Ready" badge (absence of "Blocked" indicates ready)
- Maintains clean UI, reduces visual noise

**IssueSheet (detail view):**

- Show "🔒 Blocked by N dependencies" summary at top of dependency section
- Visually group blocking dependencies separately from satisfied ones
- Provides context for why issue is blocked

### 2. Computation Strategy

**Client-side computation:**

- Continue using existing `isBlocked()` and `isReady()` helpers
- Dependencies are already loaded with issues, no extra queries needed
- Simpler, faster, and sufficient for single-user app

**No server-side computation:**

- Not needed for MVP
- Can be added later if filtering/sorting by blocked state is required

### 3. State Updates

**Page refresh required:**

- When a dependency's status changes, blocked states update on next page load
- Acceptable for single-user app with no real-time requirements (per CLAUDE.md)
- Simplest implementation, avoids complexity of real-time updates

### 4. Blocked Tab Behavior

**Show all blocked issues:**

- Include issues in any status (todo, doing, in_review, done, canceled)
- Useful for surfacing data quality issues (e.g., done issue still has blocking deps)
- Maintains consistency with existing `blockedIssues` store implementation

## Component Changes

### IssueRow.svelte

**Current state:**

- Already computes `blocked` status using `isBlocked(issue)`
- Shows "Blocked" badge when blocked

**Changes:**

1. Add blocking dependency count
2. Update badge text from "Blocked" to "Blocked (N)"

**Implementation:**

```svelte
<script lang="ts">
  import { isBlocked, getBlockingDependencies } from '$lib/utils/issue-helpers';

  let blocked = $derived(isBlocked(issue));
  let blockingCount = $derived(getBlockingDependencies(issue).length);
</script>

{#if blocked}
  <Badge variant="status-blocked" class="text-xs">
    Blocked ({blockingCount})
  </Badge>
{/if}
```

### DependencyManagementSection.svelte

**Current state:**

- Displays list of dependencies
- Shows dependency status

**Changes:**

1. Add blocking summary at top when blocked
2. Group blocking dependencies separately from satisfied ones

**Implementation:**

```svelte
<script lang="ts">
  import { getBlockingDependencies, getSatisfiedDependencies } from '$lib/utils/issue-helpers';

  let blockingDeps = $derived(getBlockingDependencies(issue));
  let satisfiedDeps = $derived(getSatisfiedDependencies(issue));
</script>

{#if blockingDeps.length > 0}
  <div class="text-sm text-destructive font-medium mb-2">
    🔒 Blocked by {blockingDeps.length}
    {blockingDeps.length === 1 ? 'dependency' : 'dependencies'}
  </div>
{/if}

<!-- List blocking deps first -->
{#each blockingDeps as dep}
  <!-- Dependency display -->
{/each}

<!-- Then satisfied deps -->
{#if satisfiedDeps.length > 0}
  <div class="text-sm text-muted-foreground mt-4 mb-2">Satisfied dependencies</div>
  {#each satisfiedDeps as dep}
    <!-- Dependency display -->
  {/each}
{/if}
```

### Computed Stores (src/lib/stores/computed.ts)

**No changes needed:**

- `readyIssues` already uses `isReady()` (status = todo AND not blocked)
- `blockedIssues` already uses `isBlocked()` (has deps not done/canceled)
- Tab counts update reactively
- Existing implementation is correct

## Testing Strategy

### Unit Tests (tests/unit/utils/issue-helpers.test.ts)

**Existing tests to verify:**

- `isBlocked()` correctly identifies blocked issues
- `isReady()` correctly identifies ready issues (todo + not blocked)
- `getBlockingDependencies()` returns only non-done/canceled deps
- `getSatisfiedDependencies()` returns only done/canceled deps

**Edge cases covered:**

- Issue with no dependencies (not blocked, ready if todo)
- Issue with all satisfied dependencies (not blocked)
- Issue with mix of blocking and satisfied dependencies (blocked)
- Issue with only blocking dependencies (blocked)
- `in_review` status counts as blocking (not satisfied)

### Component Tests (tests/component/)

**IssueRow.test.ts:**

- Given issue with 2 blocking deps → shows "Blocked (2)"
- Given issue with 1 blocking dep → shows "Blocked (1)"
- Given ready issue (todo, no blocking deps) → shows no blocked badge
- Given non-todo blocked issue → shows "Blocked (N)" badge

**DependencyManagementSection.test.ts:**

- Shows "Blocked by N dependencies" summary when blocked
- Lists blocking deps separately from satisfied deps
- Shows correct singular/plural ("dependency" vs "dependencies")
- Hides summary when not blocked

### Integration Tests (tests/integration/)

**Store behavior:**

- Ready tab excludes blocked todo issues
- Blocked tab includes all issues with blocking dependencies
- Tab counts update when issue status changes

**State updates:**

- Changing dependency status to "done" removes it from blocking list (after refresh)
- Changing dependency status to "canceled" removes it from blocking list (after refresh)
- Changing dependency status to "in_review" keeps it in blocking list

### E2E Tests

**Not needed** - This is purely UI display logic using existing business logic, not a critical user flow requiring E2E coverage.

## Implementation Checklist

Following TDD (Red-Green-Refactor):

1. **RED - Write failing tests:**
   - [ ] Component test: IssueRow shows "Blocked (N)" with correct count
   - [ ] Component test: DependencyManagementSection shows blocking summary
   - [ ] Component test: Blocking/satisfied deps grouped correctly

2. **GREEN - Implement minimal solution:**
   - [ ] Update IssueRow to import and use `getBlockingDependencies()`
   - [ ] Update IssueRow badge to show count: "Blocked ({blockingCount})"
   - [ ] Update DependencyManagementSection to show blocking summary
   - [ ] Group blocking deps first, then satisfied deps

3. **REFACTOR - Improve code quality:**
   - [ ] Extract any repeated logic
   - [ ] Ensure consistent naming
   - [ ] Verify all tests still pass

4. **VERIFY:**
   - [ ] All tests pass
   - [ ] Manual testing: blocked count displays correctly
   - [ ] Manual testing: Ready tab shows only unblocked todo issues
   - [ ] Manual testing: Blocked tab shows all blocked issues

## Success Criteria

- [ ] Issue rows show "Blocked (N)" badge with accurate count
- [ ] Ready issues have no explicit badge (clean UI)
- [ ] Issue detail shows blocking summary and grouped dependencies
- [ ] Ready tab contains only todo issues without blocking dependencies
- [ ] Blocked tab contains all issues with blocking dependencies
- [ ] Changing prerequisite status updates blocked state (after refresh)
- [ ] All tests pass (unit, component, integration)

## Out of Scope (Future Enhancements)

- Real-time updates when dependency status changes
- Server-side blocked state computation
- Filtering/sorting by blocked count
- Visual dependency graph showing blocking paths
- Notifications when issues become unblocked
