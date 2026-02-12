# Cycle Prevention (App-Layer) - Design Document

**Date:** 2026-02-12
**Issue:** CRO-1100 - Issue 5.3 — Cycle prevention (app-layer) when creating dependencies
**Parent Epic:** EPIC 5 — Dependencies + "Ready/Blocked"

## Overview

Implement app-layer cycle prevention when creating dependencies using database-only validation. Remove unused client-side cycle detection code to maintain a single source of truth.

## Architecture Decision

### Database-Only Validation

All cycle detection happens via PostgreSQL `check_dependency_cycle()` RPC function. No client-side DFS or graph algorithms for validation purposes.

**Rationale:**

- Single source of truth (no duplicate logic)
- Simpler codebase (YAGNI principle)
- Database function is already comprehensive and tested
- Acceptable latency for personal-scale usage (~500 issues max)

### Error Messaging

Generic error message: "Cannot add: this would create a circular dependency"

No cycle path visualization or detailed explanations in MVP.

## Current Implementation (Keep)

### AddDependencyDialog.svelte

Already implements the desired flow:

1. User selects issue to add as dependency
2. Calls `supabase.rpc('check_dependency_cycle', {new_issue_id, new_depends_on_id})`
3. If cycle detected (`returns true`): Shows error banner, dialog stays open
4. If valid (`returns false`): Inserts dependency, refreshes data, closes dialog

### Database Function

`check_dependency_cycle(new_issue_id UUID, new_depends_on_id UUID) RETURNS BOOLEAN`

Uses recursive CTE to detect:

- Self-dependencies (A → A)
- Direct cycles (A → B → A)
- Transitive cycles (A → B → C → A)

Location: `supabase/migrations/001_initial_schema.sql` lines 101-135

## Changes Required

### 1. Remove Client-Side Cycle Detection

**File:** `src/lib/utils/dependency-graph.ts`

**Delete:**

- `wouldCreateCycle()` function (lines 42-85)
- `findDependencyPath()` function (lines 93-128)
- `buildAdjacencyList()` helper (lines 19-29) - only used by deleted functions

**Keep:**

- `topologicalSort()` - Used for visualization/ordering
- `getBlockedIssues()` - Used for displaying blocking relationships
- `getTransitiveDependencies()` - Used for dependency analysis

### 2. Update Unit Tests

**File:** `src/lib/utils/dependency-graph.test.ts`

**Remove test suites for:**

- `wouldCreateCycle()` tests
- `findDependencyPath()` tests

**Keep:**

- `topologicalSort()` tests
- `getBlockedIssues()` tests
- `getTransitiveDependencies()` tests

### 3. Verify Integration Tests

**File:** `tests/integration/server/dependency-cycle-validation.test.ts`

**No changes needed** - These tests validate the authoritative database function behavior.

### 4. Search and Remove Imports

**Check all files** for imports of deleted functions:

- `import { wouldCreateCycle } from ...`
- `import { findDependencyPath } from ...`

Remove these imports and any code using them (if any exists).

## Acceptance Criteria

1. ✅ Self-dependency rejected (via database function) - VERIFIED
2. ✅ Indirect cycle rejected (via database function) - VERIFIED
3. ✅ Non-cycle edges succeed quickly (acceptable performance for personal scale) - VERIFIED
4. ✅ No client-side cycle detection code remains - VERIFIED
5. ✅ All tests pass (unit tests for remaining functions, integration tests for database) - VERIFIED
6. ✅ No unused imports or dead code - VERIFIED

## Testing Strategy

### Unit Tests

Test remaining utility functions:

- `topologicalSort()`
- `getBlockedIssues()`
- `getTransitiveDependencies()`

### Integration Tests

Existing tests in `dependency-cycle-validation.test.ts` validate:

- Direct cycles (A → B → A)
- Transitive cycles (A → B → C → A)
- Self-dependencies (A → A)
- Valid dependencies (no cycle)

### Manual Verification

Test in UI that cycle error appears correctly in AddDependencyDialog when attempting to create circular dependencies.

## Files Modified

1. ✅ `src/lib/utils/dependency-graph.ts` - Removed functions (wouldCreateCycle, findDependencyPath, buildAdjacencyList)
2. ✅ `src/lib/utils/dependency-graph.test.ts` - Removed tests (16 tests removed, 17 remaining)
3. ✅ No external usage found (functions were unused)

## Out of Scope

- Cycle path visualization ("Issue A → B → C → A")
- Database-level triggers to prevent insertion
- Enhanced error messaging
- Client-side pre-validation for performance
