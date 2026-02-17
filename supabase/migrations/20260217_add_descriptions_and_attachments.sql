-- Migration: Add description columns and attachments table
-- Adds rich text description to projects, epics, and issues.
-- Creates a generic attachments table for file uploads.

-- Add description columns
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE epics    ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE issues   ADD COLUMN IF NOT EXISTS description TEXT;

-- Attachments table (generic, works for projects, epics, and issues)
CREATE TABLE attachments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type  TEXT NOT NULL CHECK (entity_type IN ('project', 'epic', 'issue')),
  entity_id    UUID NOT NULL,
  file_name    TEXT NOT NULL,
  file_size    BIGINT NOT NULL,
  mime_type    TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attachments_entity  ON attachments(entity_type, entity_id);
CREATE INDEX idx_attachments_user_id ON attachments(user_id);

ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own attachments"
  ON attachments FOR ALL
  USING (auth.uid() = user_id);
