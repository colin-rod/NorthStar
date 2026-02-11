# Supabase Database Setup

This directory contains the database schema, migrations, and seed data for the Personal Issue Tracker.

## Files

- **`migrations/001_initial_schema.sql`** - Complete database schema with tables, constraints, triggers, and RLS policies
- **`seed.sql`** - Comprehensive seed data for testing all schema features
- **`verify.sql`** - Verification queries to check seed data was applied correctly
- **`verify-schema-only.sql`** - Verification queries to check schema only (without seed data)
- **`config.toml`** - Supabase local development configuration

## Status

✅ **Migration Applied** - The schema has been successfully pushed to the remote Supabase project

### What's Deployed

- **5 tables**: `projects`, `epics`, `milestones`, `issues`, `dependencies`
- **6 functions**: Cycle detection, auto-create epic, updated_at trigger, constraint validations
- **5 triggers**: Cycle prevention, auto-epic creation, sub-issue validation, default epic enforcement
- **RLS policies**: User-scoped access for all tables
- **15+ indexes**: Performance optimization for common queries

## Next Steps: Apply Seed Data

The seed data hasn't been applied yet. To complete the verification:

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard/project/ahswccjbpqawiuhdbtuc
2. Navigate to **SQL Editor** in the left sidebar
3. Click **"+ New query"**
4. Copy the contents of `seed.sql` and paste into the editor
5. Click **"Run"** to execute
6. Review the output - you should see success messages and a summary

### Option 2: Via psql (if you have connection string)

```bash
psql "<your-connection-string>" < supabase/seed.sql
```

## Verify Schema (No Seed Data Required)

You can verify the schema was correctly applied by running:

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `verify-schema-only.sql`
3. Run the queries
4. Check that:
   - All 5 tables exist
   - All constraints are in place
   - RLS is enabled with policies
   - All functions and triggers exist

## Verify Seed Data (After Applying)

After applying seed data, run `verify.sql` to check:

1. Auto-created "Unassigned" epics (via trigger)
2. Dependency cycle prevention works
3. All constraints enforced (story points, status enums, etc.)
4. Blocked/Ready issue state logic
5. RLS policies active

## What the Seed Data Tests

The seed script creates:

- **2 projects**: "Personal Tasks" and "Work Projects"
- **7 epics**: Including auto-created "Unassigned" epics
- **3 milestones**: With due dates
- **10 issues**: Various statuses, priorities, story points
- **4 dependencies**: Testing blocking relationships

### Critical Test Cases

1. **Cycle Prevention**: Attempts to create a circular dependency (should fail)
2. **Blocked Issues**: Issues with incomplete dependencies
3. **Ready Issues**: Issues with no blockers and status = "todo"
4. **Constraint Violations**: Invalid story points, invalid status, self-dependencies (all should fail)
5. **Sub-issue Validation**: Sub-issues must be in same project as parent

## Schema Features Validated

✅ **Auto-create "Unassigned" epic** - Trigger creates default epic for new projects
✅ **Dependency cycle prevention** - Recursive CTE prevents circular dependencies
✅ **Story points constraint** - Only allows: 1, 2, 3, 5, 8, 13, 21, or NULL
✅ **Status enum constraint** - Only allows: todo, doing, in_review, done, canceled
✅ **Sub-issue project validation** - Sub-issues must be in same project as parent
✅ **No self-dependencies** - CHECK constraint prevents issue depending on itself
✅ **RLS policies** - Users can only access their own data

## Development Commands

```bash
# Link to remote project (already done)
supabase link --project-ref ahswccjbpqawiuhdbtuc

# Push migrations to remote
supabase db push

# Pull remote schema changes
supabase db pull

# Start local Supabase (for local development)
supabase start

# Reset local database
supabase db reset
```

## Connection Info

- **Project URL**: https://ahswccjbpqawiuhdbtuc.supabase.co
- **Project Ref**: ahswccjbpqawiuhdbtuc
- **Environment Variables**: See `.env.local`
