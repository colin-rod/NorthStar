-- Extend create_default_epic to also create "Future Work" epic on project creation
CREATE OR REPLACE FUNCTION create_default_epic()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO epics (project_id, name, status, is_default, sort_order)
    VALUES (NEW.id, 'Unassigned', 'active', TRUE, 0);

    INSERT INTO epics (project_id, name, status, is_default, sort_order)
    VALUES (NEW.id, 'Future Work', 'active', FALSE, 1);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
