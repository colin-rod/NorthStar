-- Add milestone support to epics
ALTER TABLE epics
  ADD COLUMN milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL;

CREATE INDEX idx_epics_milestone_id ON epics(milestone_id);
