-- Migration: Add links table
-- Generic named hyperlinks for projects, epics, and issues.

CREATE TABLE links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('project', 'epic', 'issue')),
  entity_id   UUID NOT NULL,
  url         TEXT NOT NULL,
  label       TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_links_entity  ON links(entity_type, entity_id);
CREATE INDEX idx_links_user_id ON links(user_id);

ALTER TABLE links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own links"
  ON links FOR ALL
  USING (auth.uid() = user_id);
