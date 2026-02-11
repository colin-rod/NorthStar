-- Migration: Add user_id columns to epics and issues for direct RLS
-- Issue: 2.2 — RLS policies for single-user ownership (secure-by-default)
-- Date: 2026-02-11

-- ============================================================================
-- SCHEMA CHANGES: Add user_id columns
-- ============================================================================

-- Add user_id to epics (nullable initially for backfill)
ALTER TABLE epics ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to issues (nullable initially for backfill)
ALTER TABLE issues ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- ============================================================================
-- TRIGGER FUNCTIONS: Auto-populate user_id from projects
-- ============================================================================

-- Function: Sync epic user_id from parent project
CREATE OR REPLACE FUNCTION sync_epic_user_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Look up user_id from parent project
    NEW.user_id := (SELECT user_id FROM projects WHERE id = NEW.project_id);

    -- Fail fast if project doesn't exist or has no user_id
    IF NEW.user_id IS NULL THEN
        RAISE EXCEPTION 'Cannot find user_id for project_id: %', NEW.project_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Sync issue user_id from parent project
CREATE OR REPLACE FUNCTION sync_issue_user_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Look up user_id from parent project
    NEW.user_id := (SELECT user_id FROM projects WHERE id = NEW.project_id);

    -- Fail fast if project doesn't exist or has no user_id
    IF NEW.user_id IS NULL THEN
        RAISE EXCEPTION 'Cannot find user_id for project_id: %', NEW.project_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS: Attach sync functions to tables
-- ============================================================================

-- Trigger: Auto-sync epic user_id on insert/update
CREATE TRIGGER sync_epic_user_id_trigger
    BEFORE INSERT OR UPDATE ON epics
    FOR EACH ROW
    EXECUTE FUNCTION sync_epic_user_id();

-- Trigger: Auto-sync issue user_id on insert/update
CREATE TRIGGER sync_issue_user_id_trigger
    BEFORE INSERT OR UPDATE ON issues
    FOR EACH ROW
    EXECUTE FUNCTION sync_issue_user_id();

-- ============================================================================
-- BACKFILL: Populate user_id for existing rows
-- ============================================================================

-- Backfill epics (triggers will populate from projects)
UPDATE epics SET user_id = user_id WHERE user_id IS NULL;

-- Backfill issues (triggers will populate from projects)
UPDATE issues SET user_id = user_id WHERE user_id IS NULL;

-- ============================================================================
-- CONSTRAINTS: Make user_id required
-- ============================================================================

-- Make user_id NOT NULL on epics
ALTER TABLE epics ALTER COLUMN user_id SET NOT NULL;

-- Make user_id NOT NULL on issues
ALTER TABLE issues ALTER COLUMN user_id SET NOT NULL;

-- ============================================================================
-- RLS POLICIES: Replace JOIN-based with direct user_id checks
-- ============================================================================

-- Drop old JOIN-based policy for epics
DROP POLICY IF EXISTS "Users can access epics in their projects" ON epics;

-- Create new direct user_id policy for epics
CREATE POLICY "Users can access their own epics"
    ON epics FOR ALL
    USING (auth.uid() = user_id);

-- Drop old JOIN-based policy for issues
DROP POLICY IF EXISTS "Users can access issues in their projects" ON issues;

-- Create new direct user_id policy for issues
CREATE POLICY "Users can access their own issues"
    ON issues FOR ALL
    USING (auth.uid() = user_id);

-- ============================================================================
-- INDEXES: Add indexes for RLS performance
-- ============================================================================

-- Index on epics.user_id for fast policy evaluation
CREATE INDEX idx_epics_user_id ON epics(user_id);

-- Index on issues.user_id for fast policy evaluation
CREATE INDEX idx_issues_user_id ON issues(user_id);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
--
-- Changes:
--   1. Added user_id columns to epics and issues
--   2. Created triggers to auto-populate user_id from projects
--   3. Backfilled existing data
--   4. Added NOT NULL constraints
--   5. Updated RLS policies to use direct user_id checks
--   6. Added indexes for performance
--
-- To verify:
--   Run: psql < supabase/verify-rls.sql
--   Run: psql < supabase/verify.sql
--
-- To rollback:
--   Run: psql < supabase/migrations/002_add_user_id_to_epics_and_issues_rollback.sql
