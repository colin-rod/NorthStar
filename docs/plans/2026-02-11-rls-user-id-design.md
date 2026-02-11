# RLS Policies for Single-User Ownership Design

**Date:** 2026-02-11
**Issue:** Issue 2.2 — RLS policies for single-user ownership (secure-by-default)
**Parent:** EPIC 2 — Database Schema + Constraints

## Overview

Add `user_id` columns to `epics` and `issues` tables and update RLS policies to use direct user ownership checks instead of JOIN-based policies. This simplifies policies, improves query performance, and maintains security through database-level enforcement.

## Goals

1. Add `user_id` columns to epics and issues tables
2. Automatically synchronize user_id using database triggers
3. Update RLS policies to use direct `auth.uid() = user_id` checks
4. Verify with SQL-based tests covering all acceptance criteria

## Design Decisions

### 1. Schema Changes

**Add user_id to epics:**

```sql
ALTER TABLE epics ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX idx_epics_user_id ON epics(user_id);
```

**Add user_id to issues:**

```sql
ALTER TABLE issues ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX idx_issues_user_id ON issues(user_id);
```

**Rationale:**

- Denormalize user_id for RLS performance (avoids JOINs in policy checks)
- Indexed for fast policy evaluation
- NOT NULL ensures data integrity
- Cascading deletes maintain referential integrity
- Clean migration (assume fresh database)

### 2. Automatic Synchronization with Triggers

**Epic user_id sync:**

```sql
CREATE OR REPLACE FUNCTION sync_epic_user_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.user_id := (SELECT user_id FROM projects WHERE id = NEW.project_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_epic_user_id_trigger
    BEFORE INSERT OR UPDATE ON epics
    FOR EACH ROW
    EXECUTE FUNCTION sync_epic_user_id();
```

**Issue user_id sync:**

```sql
CREATE OR REPLACE FUNCTION sync_issue_user_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.user_id := (SELECT user_id FROM projects WHERE id = NEW.project_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_issue_user_id_trigger
    BEFORE INSERT OR UPDATE ON issues
    FOR EACH ROW
    EXECUTE FUNCTION sync_issue_user_id();
```

**Rationale:**

- Zero application code changes needed
- Consistency enforced at database level
- Automatic synchronization if project ownership changes
- Fails fast if project doesn't exist (NULL violates NOT NULL)

### 3. Updated RLS Policies

**Epics - Replace JOIN-based policy:**

```sql
DROP POLICY "Users can access epics in their projects" ON epics;

CREATE POLICY "Users can access their own epics"
    ON epics FOR ALL
    USING (auth.uid() = user_id);
```

**Issues - Replace JOIN-based policy:**

```sql
DROP POLICY "Users can access issues in their projects" ON issues;

CREATE POLICY "Users can access their own issues"
    ON issues FOR ALL
    USING (auth.uid() = user_id);
```

**Unchanged policies:**

- Projects: Already uses `auth.uid() = user_id` ✓
- Milestones: Already uses `auth.uid() = user_id` ✓
- Dependencies: Keep JOIN-based (no user_id, checks through issues)

**Rationale:**

- Simpler policies without subqueries
- Better performance (indexed equality vs EXISTS)
- Consistent pattern across user-owned tables
- Dependencies inherit protection through issues table

### 4. SQL-Based RLS Testing

**File:** `supabase/verify-rls.sql`

**Test structure:**

1. **Setup:**
   - Create test roles: `test_user_1`, `test_user_2`
   - Insert test users into `auth.users`
   - Each user creates sample data

2. **Test Case 1: Unauthenticated requests fail**
   - `SET ROLE anonymous`
   - Attempt operations on all tables
   - Expect: 0 rows for SELECT, errors for mutations

3. **Test Case 2: Authenticated user can CRUD own records**
   - `SET ROLE test_user_1`
   - SELECT/INSERT/UPDATE/DELETE own data
   - Expect: All operations succeed

4. **Test Case 3: Another user cannot access your data**
   - `SET ROLE test_user_2`
   - Attempt to access test_user_1's data
   - Expect: 0 rows returned, 0 rows affected

5. **Cleanup:**
   - Drop test roles
   - Delete test data

**Output format:**

```
check_name                          | expected | actual | status
------------------------------------|----------|--------|--------
Unauthed SELECT projects            | 0        | 0      | PASS
Authed user can SELECT own projects | 1        | 1      | PASS
Other user cannot SELECT projects   | 0        | 0      | PASS
...
```

**Rationale:**

- Matches existing `verify.sql` pattern
- Fast execution (no external dependencies)
- Can run with: `psql < verify-rls.sql`
- Covers all three acceptance criteria

## Migration Execution Plan

### File: `002_add_user_id_to_epics_and_issues.sql`

**Execution order:**

1. **Add columns (nullable first):**

   ```sql
   ALTER TABLE epics ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
   ALTER TABLE issues ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
   ```

2. **Create sync triggers:**
   - Create trigger functions
   - Create triggers on epics and issues

3. **Backfill existing data:**

   ```sql
   UPDATE epics SET user_id = user_id; -- Triggers populate from projects
   UPDATE issues SET user_id = user_id; -- Triggers populate from projects
   ```

4. **Add NOT NULL constraints:**

   ```sql
   ALTER TABLE epics ALTER COLUMN user_id SET NOT NULL;
   ALTER TABLE issues ALTER COLUMN user_id SET NOT NULL;
   ```

5. **Update RLS policies:**
   - Drop old policies
   - Create new direct user_id policies

6. **Add indexes:**
   ```sql
   CREATE INDEX idx_epics_user_id ON epics(user_id);
   CREATE INDEX idx_issues_user_id ON issues(user_id);
   ```

### Rollback: `002_add_user_id_to_epics_and_issues_rollback.sql`

```sql
-- Restore old RLS policies
DROP POLICY "Users can access their own epics" ON epics;
DROP POLICY "Users can access their own issues" ON issues;

CREATE POLICY "Users can access epics in their projects" ON epics FOR ALL
    USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = epics.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can access issues in their projects" ON issues FOR ALL
    USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = issues.project_id AND projects.user_id = auth.uid()));

-- Drop triggers and functions
DROP TRIGGER IF EXISTS sync_epic_user_id_trigger ON epics;
DROP TRIGGER IF EXISTS sync_issue_user_id_trigger ON issues;
DROP FUNCTION IF EXISTS sync_epic_user_id();
DROP FUNCTION IF EXISTS sync_issue_user_id();

-- Drop columns (CASCADE drops indexes)
ALTER TABLE epics DROP COLUMN user_id CASCADE;
ALTER TABLE issues DROP COLUMN user_id CASCADE;
```

### Testing Workflow

1. Apply migration to local Supabase: `npx supabase db reset`
2. Run RLS verification: `psql < supabase/verify-rls.sql`
3. Run existing verification: `psql < supabase/verify.sql`
4. If all pass, push to remote: `npx supabase db push`

## Acceptance Criteria

✅ **Unauthed requests fail** - Tested in verify-rls.sql (anonymous role)
✅ **Authed user can CRUD own records** - Tested in verify-rls.sql (test_user_1)
✅ **Another user (test) cannot access your data** - Tested in verify-rls.sql (test_user_2)

## Benefits

1. **Performance:** Direct user_id checks faster than JOIN-based policies
2. **Simplicity:** Consistent `auth.uid() = user_id` pattern
3. **Security:** Enforced at database level with RLS
4. **Maintainability:** Triggers keep data in sync automatically
5. **Testability:** SQL-based tests match existing verification pattern

## Trade-offs

**Chosen:** Denormalized user_id with triggers
**Alternative:** Keep JOIN-based policies

**Why denormalization wins:**

- Minimal overhead (triggers only fire on INSERT/UPDATE)
- Significant performance gain on every SELECT with RLS
- Single-user app means no complex ownership changes
- Consistent with existing projects/milestones pattern
