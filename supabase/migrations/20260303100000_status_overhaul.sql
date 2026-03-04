-- Migration: Status System Overhaul
-- Expands status values for projects, epics, and issues.
-- Renames: done → completed (projects/epics), doing → in_progress (issues)
-- Adds: backlog, planned, on_hold (projects); backlog, on_hold (epics); backlog (issues)

-- ============================================================
-- STEP 1: Drop inline CHECK constraints (they are unnamed, so
--         we find them via pg_constraint and drop by name)
-- ============================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  -- Drop all CHECK constraints on projects.status
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'projects'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%status%'
  LOOP
    EXECUTE 'ALTER TABLE projects DROP CONSTRAINT ' || quote_ident(r.conname);
  END LOOP;

  -- Drop all CHECK constraints on epics.status
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'epics'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%status%'
  LOOP
    EXECUTE 'ALTER TABLE epics DROP CONSTRAINT ' || quote_ident(r.conname);
  END LOOP;

  -- Drop all CHECK constraints on issues.status
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'issues'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%status%'
  LOOP
    EXECUTE 'ALTER TABLE issues DROP CONSTRAINT ' || quote_ident(r.conname);
  END LOOP;
END $$;

-- ============================================================
-- STEP 2: Data migration (rename existing values)
-- Must happen BEFORE adding new constraints
-- ============================================================

UPDATE projects SET status = 'completed' WHERE status = 'done';
UPDATE epics    SET status = 'completed' WHERE status = 'done';
UPDATE issues   SET status = 'in_progress' WHERE status = 'doing';

-- Safety fallback: map any unknown legacy values to 'backlog'
UPDATE projects SET status = 'backlog'
  WHERE status NOT IN ('backlog', 'planned', 'active', 'on_hold', 'completed', 'canceled');
UPDATE epics SET status = 'backlog'
  WHERE status NOT IN ('backlog', 'active', 'on_hold', 'completed', 'canceled');
UPDATE issues SET status = 'backlog'
  WHERE status NOT IN ('backlog', 'todo', 'in_progress', 'in_review', 'done', 'canceled');

-- ============================================================
-- STEP 3: Add new CHECK constraints
-- ============================================================

ALTER TABLE projects
  ADD CONSTRAINT projects_status_check
  CHECK (status IN ('backlog', 'planned', 'active', 'on_hold', 'completed', 'canceled'));

ALTER TABLE epics
  ADD CONSTRAINT epics_status_check
  CHECK (status IN ('backlog', 'active', 'on_hold', 'completed', 'canceled'));

ALTER TABLE issues
  ADD CONSTRAINT issues_status_check
  CHECK (status IN ('backlog', 'todo', 'in_progress', 'in_review', 'done', 'canceled'));
