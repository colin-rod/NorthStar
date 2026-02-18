-- Add priority column to epics (same P0-P3 scale as issues)
-- Nullable: null means no priority set
ALTER TABLE epics ADD COLUMN priority integer CHECK (priority BETWEEN 0 AND 3);
