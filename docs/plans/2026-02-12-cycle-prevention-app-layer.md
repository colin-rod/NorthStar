# Cycle Prevention (App-Layer) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove client-side cycle detection code to maintain database-only validation as the single source of truth.

**Architecture:** All cycle detection happens via PostgreSQL `check_dependency_cycle()` RPC function. The `AddDependencyDialog.svelte` component already implements the correct app-layer flow. This plan removes duplicate client-side validation logic (`wouldCreateCycle`, `findDependencyPath`) that is unused and redundant.

**Tech Stack:** TypeScript, Vitest (testing), Supabase (PostgreSQL RPC)

---

## Task 1: Search for Usage of Functions to be Deleted

**Files:**

- Search: entire `src/` directory

**Step 1: Search for imports of wouldCreateCycle**

Run: `grep -r "wouldCreateCycle" src/`

Expected: Only found in:

- `src/lib/utils/dependency-graph.ts` (definition)
- `src/lib/utils/dependency-graph.test.ts` (tests)

**Step 2: Search for imports of findDependencyPath**

Run: `grep -r "findDependencyPath" src/`

Expected: Only found in:

- `src/lib/utils/dependency-graph.ts` (definition)
- `src/lib/utils/dependency-graph.test.ts` (tests)

**Step 3: Search for imports of buildAdjacencyList**

Run: `grep -r "buildAdjacencyList" src/`

Expected: Only found in:

- `src/lib/utils/dependency-graph.ts` (used internally by functions we're deleting)

**Step 4: Document findings**

If any usage is found outside of these two files, document it here. Otherwise, proceed to Task 2.

Expected: No external usage found (functions are unused)

---

## Task 2: Remove Tests for Deleted Functions

**Files:**

- Modify: `src/lib/utils/dependency-graph.test.ts`

**Step 1: Run tests to establish baseline**

Run: `npm run test src/lib/utils/dependency-graph.test.ts`

Expected: All tests pass

**Step 2: Remove wouldCreateCycle test suite**

Delete lines 40-114 (entire `describe('wouldCreateCycle', ...)` block)

**Step 3: Remove findDependencyPath test suite**

Delete lines 116-174 (entire `describe('findDependencyPath', ...)` block)

**Step 4: Remove imports of deleted functions**

In the imports at the top (lines 10-16), remove:

- `wouldCreateCycle,`
- `findDependencyPath,`

The import should now look like:

```typescript
import { topologicalSort, getBlockedIssues, getTransitiveDependencies } from './dependency-graph';
```

**Step 5: Run tests to verify remaining tests pass**

Run: `npm run test src/lib/utils/dependency-graph.test.ts`

Expected: All remaining tests (topologicalSort, getBlockedIssues, getTransitiveDependencies) pass

**Step 6: Commit**

```bash
git add src/lib/utils/dependency-graph.test.ts
git commit -m "test: remove tests for client-side cycle detection

Remove wouldCreateCycle and findDependencyPath test suites.
Database-only validation via check_dependency_cycle() RPC is the
authoritative source of truth.

Part of CRO-1100 (cycle prevention app-layer).

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Remove Client-Side Cycle Detection Functions

**Files:**

- Modify: `src/lib/utils/dependency-graph.ts`

**Step 1: Run tests to establish baseline**

Run: `npm run test src/lib/utils/dependency-graph.test.ts`

Expected: All tests pass (from Task 2, only tests for remaining functions)

**Step 2: Remove buildAdjacencyList helper**

Delete lines 19-29 (entire `buildAdjacencyList` function and its JSDoc)

**Step 3: Remove wouldCreateCycle function**

Delete lines 31-85 (entire `wouldCreateCycle` function with JSDoc comment)

After deletion, the next function should be `findDependencyPath`.

**Step 4: Remove findDependencyPath function**

Delete lines 87-128 (entire `findDependencyPath` function with JSDoc comment)

After deletion, the next function should be `topologicalSort`.

**Step 5: Update file header comment**

Update lines 7-9 to remove reference to "PostgreSQL recursive CTE for server-side validation":

```typescript
/**
 * Dependency Graph Utilities
 *
 * Handles topological sorting and dependency analysis for issue dependencies.
 *
 * Note: Cycle detection is handled server-side via PostgreSQL check_dependency_cycle() function.
 * Client-side functions focus on visualization and dependency analysis.
 */
```

**Step 6: Run type checking**

Run: `npm run check`

Expected: No TypeScript errors

**Step 7: Run tests to verify no breakage**

Run: `npm run test src/lib/utils/dependency-graph.test.ts`

Expected: All tests pass (topologicalSort, getBlockedIssues, getTransitiveDependencies)

**Step 8: Commit**

```bash
git add src/lib/utils/dependency-graph.ts
git commit -m "refactor: remove client-side cycle detection

Remove wouldCreateCycle, findDependencyPath, and buildAdjacencyList.
Database check_dependency_cycle() RPC is the single source of truth.

Keep topologicalSort, getBlockedIssues, and getTransitiveDependencies
for visualization and dependency analysis.

Part of CRO-1100 (cycle prevention app-layer).

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Verify Integration Tests Still Pass

**Files:**

- Test: `tests/integration/server/dependency-cycle-validation.test.ts`

**Step 1: Run integration tests**

Run: `npm run test tests/integration/server/dependency-cycle-validation.test.ts`

Expected: All tests pass (validates database function behavior)

**Step 2: Verify coverage of acceptance criteria**

Check that tests cover:

- ✅ Self-dependency rejected (line 191-200)
- ✅ Direct cycle rejected (line 116-140)
- ✅ Transitive cycle rejected (line 142-163)
- ✅ Valid dependencies succeed (line 165-189)

Expected: All acceptance criteria covered by integration tests

---

## Task 5: Run Full Test Suite

**Files:**

- Test: all tests

**Step 1: Run all tests**

Run: `npm run test`

Expected: All tests pass

**Step 2: Verify no TypeScript errors**

Run: `npm run check`

Expected: No errors

**Step 3: Verify linting passes**

Run: `npm run lint`

Expected: No errors

---

## Task 6: Manual Verification in UI

**Files:**

- Test: UI behavior in development server

**Step 1: Start development server**

Run: `npm run dev`

**Step 2: Navigate to an issue and open dependency dialog**

1. Create or navigate to a test issue
2. Open the "Add Dependency" dialog
3. Try to add a dependency that would create a cycle

**Step 3: Verify error message appears**

Expected: Error banner shows "Cannot add: this would create a circular dependency"

**Step 4: Verify dialog stays open**

Expected: Dialog does not close, allowing user to try another issue

**Step 5: Add a valid dependency**

Expected: Dependency added successfully, dialog closes, data refreshes

**Step 6: Stop development server**

Run: Ctrl+C to stop server

---

## Task 7: Update Design Document Status

**Files:**

- Modify: `docs/plans/2026-02-12-cycle-prevention-app-layer-design.md`

**Step 1: Update acceptance criteria to mark as complete**

Change lines 102-106 to:

```markdown
## Acceptance Criteria

1. ✅ Self-dependency rejected (via database function) - VERIFIED
2. ✅ Indirect cycle rejected (via database function) - VERIFIED
3. ✅ Non-cycle edges succeed quickly (acceptable performance for personal scale) - VERIFIED
4. ✅ No client-side cycle detection code remains - VERIFIED
5. ✅ All tests pass (unit tests for remaining functions, integration tests for database) - VERIFIED
6. ✅ No unused imports or dead code - VERIFIED
```

**Step 2: Update Files Modified section**

Change lines 128-130 to:

```markdown
## Files Modified

1. ✅ `src/lib/utils/dependency-graph.ts` - Removed functions
2. ✅ `src/lib/utils/dependency-graph.test.ts` - Removed tests
3. ✅ No external usage found (functions were unused)
```

**Step 3: Commit**

```bash
git add docs/plans/2026-02-12-cycle-prevention-app-layer-design.md
git commit -m "docs: mark cycle prevention implementation complete

All acceptance criteria verified.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Completion Checklist

After completing all tasks, verify:

- ✅ `buildAdjacencyList` removed from `dependency-graph.ts`
- ✅ `wouldCreateCycle` removed from `dependency-graph.ts`
- ✅ `findDependencyPath` removed from `dependency-graph.ts`
- ✅ Corresponding tests removed from `dependency-graph.test.ts`
- ✅ No imports of deleted functions exist in codebase
- ✅ All unit tests pass (remaining functions)
- ✅ All integration tests pass (database function)
- ✅ Full test suite passes
- ✅ TypeScript check passes
- ✅ Linting passes
- ✅ Manual UI verification complete
- ✅ Design document updated

## Success Metrics

- Code removed: ~100 lines (functions + tests)
- Single source of truth: Database `check_dependency_cycle()` RPC
- Test coverage maintained: 100% for remaining functions
- No regressions: All existing tests pass
