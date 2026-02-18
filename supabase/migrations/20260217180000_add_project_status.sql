-- Migration: Add status column to projects table
-- Projects can be Active (default), Done, or Canceled.
-- Mirrors the existing Epic status lifecycle.

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS status TEXT
    NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'done', 'canceled'));
