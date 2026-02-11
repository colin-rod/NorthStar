# RLS User ID Implementation Plan

**Date:** 2026-02-11
**Design Doc:** [2026-02-11-rls-user-id-design.md](./2026-02-11-rls-user-id-design.md)
**Issue:** Issue 2.2 — RLS policies for single-user ownership

## Implementation Steps

### Step 1: Create Migration File Structure

**File:** `supabase/migrations/002_add_user_id_to_epics_and_issues.sql`

Create the migration file with clear sections:

- Schema changes (add columns)
- Trigger functions
- Triggers
- Backfill data
- Add constraints
- Update RLS policies
- Add indexes

**Acceptance:**

- Migration file exists with proper header comments
- Sections are clearly marked

### Step 2: Add user_id Columns

Add nullable `user_id` columns to epics and issues tables.

```sql
-- Add user_id columns (nullable initially for backfill)
ALTER TABLE epics ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE issues ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
```

**Acceptance:**

- Columns added with proper foreign key constraints
- ON DELETE CASCADE specified

### Step 3: Create Sync Trigger Functions

Create two trigger functions to automatically populate user_id from parent project.

**sync_epic_user_id():**

```sql
CREATE OR REPLACE FUNCTION sync_epic_user_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.user_id := (SELECT user_id FROM projects WHERE id = NEW.project_id);
    IF NEW.user_id IS NULL THEN
        RAISE EXCEPTION 'Cannot find user_id for project_id: %', NEW.project_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**sync_issue_user_id():**

```sql
CREATE OR REPLACE FUNCTION sync_issue_user_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.user_id := (SELECT user_id FROM projects WHERE id = NEW.project_id);
    IF NEW.user_id IS NULL THEN
        RAISE EXCEPTION 'Cannot find user_id for project_id: %', NEW.project_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Acceptance:**

- Both functions created with error handling
- Functions validate that user_id is found (not NULL)

### Step 4: Create Triggers

Attach triggers to epics and issues tables.

```sql
CREATE TRIGGER sync_epic_user_id_trigger
    BEFORE INSERT OR UPDATE ON epics
    FOR EACH ROW
    EXECUTE FUNCTION sync_epic_user_id();

CREATE TRIGGER sync_issue_user_id_trigger
    BEFORE INSERT OR UPDATE ON issues
    FOR EACH ROW
    EXECUTE FUNCTION sync_issue_user_id();
```

**Acceptance:**

- Triggers fire BEFORE INSERT OR UPDATE
- Triggers attached to correct tables

### Step 5: Backfill Existing Data

Use UPDATE to trigger the sync functions for existing rows.

```sql
-- Backfill user_id for existing epics
UPDATE epics SET user_id = user_id WHERE user_id IS NULL;

-- Backfill user_id for existing issues
UPDATE issues SET user_id = user_id WHERE user_id IS NULL;
```

**Acceptance:**

- All existing epics have user_id populated
- All existing issues have user_id populated
- No NULL values remain

### Step 6: Add NOT NULL Constraints

Make user_id required after backfill completes.

```sql
ALTER TABLE epics ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE issues ALTER COLUMN user_id SET NOT NULL;
```

**Acceptance:**

- Constraints added successfully
- Future inserts without user_id will fail (triggers will populate)

### Step 7: Update RLS Policies

Drop old JOIN-based policies and create new direct policies.

**Epics:**

```sql
DROP POLICY "Users can access epics in their projects" ON epics;

CREATE POLICY "Users can access their own epics"
    ON epics FOR ALL
    USING (auth.uid() = user_id);
```

**Issues:**

```sql
DROP POLICY "Users can access issues in their projects" ON issues;

CREATE POLICY "Users can access their own issues"
    ON issues FOR ALL
    USING (auth.uid() = user_id);
```

**Acceptance:**

- Old policies removed
- New policies created with correct names
- Policies use `auth.uid() = user_id` pattern

### Step 8: Add Indexes

Create indexes on new user_id columns for RLS performance.

```sql
CREATE INDEX idx_epics_user_id ON epics(user_id);
CREATE INDEX idx_issues_user_id ON issues(user_id);
```

**Acceptance:**

- Indexes created successfully
- Index names follow existing naming convention

### Step 9: Create RLS Verification Script

**File:** `supabase/verify-rls.sql`

Create comprehensive SQL test script with:

1. Test setup (create test users and data)
2. Unauthenticated tests
3. Authenticated own-data tests
4. Cross-user access denial tests
5. Test cleanup
6. Summary output

**Test sections:**

**Setup:**

```sql
-- Create test users
CREATE ROLE test_user_1 LOGIN;
CREATE ROLE test_user_2 LOGIN;

-- Insert into auth.users
INSERT INTO auth.users (id, email) VALUES
    ('11111111-1111-1111-1111-111111111111', 'test1@example.com'),
    ('22222222-2222-2222-2222-222222222222', 'test2@example.com');
```

**Test 1 - Unauthenticated:**

```sql
SET ROLE anonymous;
-- Test SELECT returns 0 rows on all tables
-- Test INSERT/UPDATE/DELETE fail
```

**Test 2 - Authenticated own data:**

```sql
SET ROLE test_user_1;
-- Test can SELECT own data
-- Test can INSERT new data
-- Test can UPDATE own data
-- Test can DELETE own data
```

**Test 3 - Cross-user access:**

```sql
SET ROLE test_user_2;
-- Test cannot SELECT test_user_1 data
-- Test cannot UPDATE test_user_1 data
-- Test cannot DELETE test_user_1 data
```

**Acceptance:**

- All three test categories implemented
- Each test outputs: check_name, expected, actual, status (PASS/FAIL)
- Cleanup section removes all test data
- Summary shows total/passed/failed counts

### Step 10: Create Rollback Script

**File:** `supabase/migrations/002_add_user_id_to_epics_and_issues_rollback.sql`

Create rollback script that:

1. Restores old RLS policies
2. Drops triggers
3. Drops trigger functions
4. Drops user_id columns

**Acceptance:**

- Rollback script created
- Script reverses all changes from main migration
- Script tested on a separate database branch

### Step 11: Test Migration Locally

Apply migration and run verification scripts.

```bash
# Reset local database with new migration
npx supabase db reset

# Run RLS verification
psql postgresql://postgres:postgres@localhost:54322/postgres < supabase/verify-rls.sql

# Run existing schema verification
psql postgresql://postgres:postgres@localhost:54322/postgres < supabase/verify.sql
```

**Acceptance:**

- Migration applies without errors
- verify-rls.sql shows all tests PASS
- verify.sql shows all existing checks still PASS
- No data corruption or constraint violations

### Step 12: Update verify.sql

Add RLS policy check to existing verify.sql to ensure new policies are present.

```sql
-- Add to existing RLS Policies section
SELECT
    'RLS Policies After user_id Migration' as check_name,
    tablename,
    policyname
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('epics', 'issues')
ORDER BY tablename, policyname;
```

**Expected output:**

- epics: "Users can access their own epics"
- issues: "Users can access their own issues"

**Acceptance:**

- verify.sql updated with new check
- Check validates correct policy names

### Step 13: Test Rollback

Verify rollback script works correctly.

```bash
# Apply rollback
psql postgresql://postgres:postgres@localhost:54322/postgres < supabase/migrations/002_add_user_id_to_epics_and_issues_rollback.sql

# Verify old policies are back
psql postgresql://postgres:postgres@localhost:54322/postgres < supabase/verify-schema-only.sql
```

**Acceptance:**

- Rollback completes without errors
- Old JOIN-based policies restored
- user_id columns removed
- All triggers and functions removed
- Database returns to pre-migration state

### Step 14: Apply to Remote Supabase

Push migration to production database.

```bash
# Push migration to remote
npx supabase db push
```

**Acceptance:**

- Migration applies successfully to remote
- No errors in Supabase dashboard
- Can verify policies in Supabase UI

### Step 15: Run Remote Verification

Execute verification scripts against remote database.

```bash
# Get remote database connection string from Supabase dashboard
# Run verify-rls.sql against remote
psql <remote-connection-string> < supabase/verify-rls.sql

# Run verify.sql against remote
psql <remote-connection-string> < supabase/verify.sql
```

**Acceptance:**

- All RLS tests PASS on remote
- All schema tests PASS on remote
- Remote database fully functional

## Testing Strategy

### Unit Tests (SQL-based)

- verify-rls.sql covers all three acceptance criteria
- Automated pass/fail output for each test
- Can be run repeatedly without side effects (cleanup)

### Integration Tests (Manual)

- Create actual user account in Supabase
- Use Supabase client to perform CRUD operations
- Verify RLS blocks unauthorized access
- Test in both local and remote environments

### Regression Tests

- Existing verify.sql ensures no functionality breaks
- Existing seed.sql still works
- All existing triggers still function

## Rollback Strategy

If issues are discovered after deployment:

1. Run rollback script immediately
2. Investigate root cause
3. Fix migration script
4. Test locally again
5. Re-apply when ready

## Success Criteria

✅ Migration applies cleanly to local and remote databases
✅ All verify-rls.sql tests PASS (unauthenticated, authenticated, cross-user)
✅ All verify.sql tests continue to PASS
✅ Rollback script successfully reverses all changes
✅ No performance degradation (indexes in place)
✅ Application code requires no changes (triggers handle sync)

## Files to Create/Modify

**New files:**

- `supabase/migrations/002_add_user_id_to_epics_and_issues.sql`
- `supabase/migrations/002_add_user_id_to_epics_and_issues_rollback.sql`
- `supabase/verify-rls.sql`

**Modified files:**

- `supabase/verify.sql` (add policy name check)

## Estimated Complexity

- **Schema changes:** Low (straightforward column additions)
- **Triggers:** Low (simple lookup logic)
- **RLS policies:** Low (replacing complex with simple)
- **Testing:** Medium (comprehensive test coverage needed)
- **Overall:** Low-Medium complexity, high confidence
