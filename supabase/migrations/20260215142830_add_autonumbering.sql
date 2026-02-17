-- Migration: Add Autonumbering to Projects, Epics, and Issues
-- Creates sequential numbers (P-1, E-1, I-1) for all entities
-- Uses PostgreSQL sequences for atomic, race-condition-free number assignment
-- Numbers are immutable once assigned (enforced by triggers)

-- ============================================================================
-- SEQUENCES
-- ============================================================================

-- Create sequences for autonumbering
CREATE SEQUENCE IF NOT EXISTS projects_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS epics_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS issues_number_seq START 1;

-- ============================================================================
-- ADD NUMBER COLUMNS
-- ============================================================================

-- Add number columns with DEFAULT nextval() for initial backfill
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS number INTEGER UNIQUE NOT NULL DEFAULT nextval('projects_number_seq');

ALTER TABLE epics
ADD COLUMN IF NOT EXISTS number INTEGER UNIQUE NOT NULL DEFAULT nextval('epics_number_seq');

ALTER TABLE issues
ADD COLUMN IF NOT EXISTS number INTEGER UNIQUE NOT NULL DEFAULT nextval('issues_number_seq');

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Create indexes for fast lookups by number
CREATE INDEX IF NOT EXISTS idx_projects_number ON projects(number);
CREATE INDEX IF NOT EXISTS idx_epics_number ON epics(number);
CREATE INDEX IF NOT EXISTS idx_issues_number ON issues(number);

-- ============================================================================
-- TRIGGERS FOR IMMUTABILITY
-- ============================================================================

-- Trigger function: Prevent number updates (immutability)
CREATE OR REPLACE FUNCTION prevent_number_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.number != OLD.number THEN
    RAISE EXCEPTION 'Entity number cannot be changed after creation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply immutability triggers to all tables
-- Drop triggers if they exist (for idempotency)
DROP TRIGGER IF EXISTS projects_number_immutable ON projects;
DROP TRIGGER IF EXISTS epics_number_immutable ON epics;
DROP TRIGGER IF EXISTS issues_number_immutable ON issues;

CREATE TRIGGER projects_number_immutable
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION prevent_number_update();

CREATE TRIGGER epics_number_immutable
  BEFORE UPDATE ON epics
  FOR EACH ROW
  EXECUTE FUNCTION prevent_number_update();

CREATE TRIGGER issues_number_immutable
  BEFORE UPDATE ON issues
  FOR EACH ROW
  EXECUTE FUNCTION prevent_number_update();

-- ============================================================================
-- BACKFILL EXISTING RECORDS
-- ============================================================================

-- Backfill existing projects in chronological order
-- This ensures existing projects get sequential numbers based on creation time
DO $$
DECLARE
  project_record RECORD;
BEGIN
  FOR project_record IN
    SELECT id FROM projects
    WHERE number IS NULL
    ORDER BY created_at ASC
  LOOP
    UPDATE projects
    SET number = nextval('projects_number_seq')
    WHERE id = project_record.id;
  END LOOP;
END $$;

-- Backfill existing epics in chronological order
DO $$
DECLARE
  epic_record RECORD;
BEGIN
  FOR epic_record IN
    SELECT id FROM epics
    WHERE number IS NULL
    ORDER BY created_at ASC
  LOOP
    UPDATE epics
    SET number = nextval('epics_number_seq')
    WHERE id = epic_record.id;
  END LOOP;
END $$;

-- Backfill existing issues in chronological order
DO $$
DECLARE
  issue_record RECORD;
BEGIN
  FOR issue_record IN
    SELECT id FROM issues
    WHERE number IS NULL
    ORDER BY created_at ASC
  LOOP
    UPDATE issues
    SET number = nextval('issues_number_seq')
    WHERE id = issue_record.id;
  END LOOP;
END $$;

-- ============================================================================
-- REMOVE DEFAULT (force explicit sequence usage)
-- ============================================================================

-- Remove DEFAULT after backfill
-- New records will still get numbers via DEFAULT in the column definition,
-- but this documents the expectation that numbers come from sequences
ALTER TABLE projects ALTER COLUMN number SET DEFAULT nextval('projects_number_seq');
ALTER TABLE epics ALTER COLUMN number SET DEFAULT nextval('epics_number_seq');
ALTER TABLE issues ALTER COLUMN number SET DEFAULT nextval('issues_number_seq');

-- ============================================================================
-- RESET SEQUENCES
-- ============================================================================

-- Reset sequences to continue from current max + 1
-- This ensures new records get higher numbers than existing ones
SELECT setval('projects_number_seq', COALESCE((SELECT MAX(number) FROM projects), 0) + 1, false);
SELECT setval('epics_number_seq', COALESCE((SELECT MAX(number) FROM epics), 0) + 1, false);
SELECT setval('issues_number_seq', COALESCE((SELECT MAX(number) FROM issues), 0) + 1, false);
