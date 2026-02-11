-- Rollback Migration: Remove user_id columns and restore JOIN-based RLS
-- Issue: 2.2 — RLS policies for single-user ownership (secure-by-default)
-- Date: 2026-02-11
--
-- This script reverses all changes made by 002_add_user_id_to_epics_and_issues.sql
--
-- WARNING: Only run this if you need to rollback the migration!

\echo 'Rolling back migration 002: user_id columns and RLS policies'

-- ============================================================================
-- RLS POLICIES: Restore old JOIN-based policies
-- ============================================================================

-- Drop new direct user_id policies
DROP POLICY IF EXISTS "Users can access their own epics" ON epics;
DROP POLICY IF EXISTS "Users can access their own issues" ON issues;

-- Restore old JOIN-based policy for epics
CREATE POLICY "Users can access epics in their projects"
    ON epics FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = epics.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Restore old JOIN-based policy for issues
CREATE POLICY "Users can access issues in their projects"
    ON issues FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = issues.project_id
            AND projects.user_id = auth.uid()
        )
    );

\echo 'RLS policies restored to JOIN-based implementation'

-- ============================================================================
-- TRIGGERS: Drop triggers
-- ============================================================================

DROP TRIGGER IF EXISTS sync_epic_user_id_trigger ON epics;
DROP TRIGGER IF EXISTS sync_issue_user_id_trigger ON issues;

\echo 'Triggers dropped'

-- ============================================================================
-- FUNCTIONS: Drop trigger functions
-- ============================================================================

DROP FUNCTION IF EXISTS sync_epic_user_id();
DROP FUNCTION IF EXISTS sync_issue_user_id();

\echo 'Trigger functions dropped'

-- ============================================================================
-- INDEXES: Drop indexes on user_id columns
-- ============================================================================

DROP INDEX IF EXISTS idx_epics_user_id;
DROP INDEX IF EXISTS idx_issues_user_id;

\echo 'Indexes dropped'

-- ============================================================================
-- SCHEMA: Remove user_id columns
-- ============================================================================

ALTER TABLE epics DROP COLUMN IF EXISTS user_id CASCADE;
ALTER TABLE issues DROP COLUMN IF EXISTS user_id CASCADE;

\echo 'user_id columns removed'

-- ============================================================================
-- ROLLBACK COMPLETE
-- ============================================================================

\echo ''
\echo 'Rollback complete!'
\echo 'Database has been restored to pre-migration state.'
\echo ''
\echo 'To verify, run: psql < supabase/verify-schema-only.sql'
\echo ''
