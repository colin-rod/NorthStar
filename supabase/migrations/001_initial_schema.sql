-- Initial Database Schema for Personal Issue Tracker
-- Based on CLAUDE.md specification

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLES
-- ============================================================================

-- Projects Table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    archived_at TIMESTAMPTZ
);

-- Epics Table
CREATE TABLE epics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'done', 'canceled')),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Milestones Table
CREATE TABLE milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    due_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Issues Table
CREATE TABLE issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    epic_id UUID NOT NULL REFERENCES epics(id) ON DELETE RESTRICT,
    parent_issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('todo', 'doing', 'in_review', 'done', 'canceled')),
    priority INTEGER NOT NULL CHECK (priority BETWEEN 0 AND 3),
    story_points INTEGER CHECK (story_points IN (1, 2, 3, 5, 8, 13, 21)),
    sort_order INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dependencies Table
CREATE TABLE dependencies (
    issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    depends_on_issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (issue_id, depends_on_issue_id),
    CHECK (issue_id != depends_on_issue_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Projects indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_archived_at ON projects(archived_at) WHERE archived_at IS NULL;

-- Epics indexes
CREATE INDEX idx_epics_project_id ON epics(project_id);
CREATE INDEX idx_epics_status ON epics(status);
CREATE INDEX idx_epics_is_default ON epics(is_default) WHERE is_default = TRUE;

-- Issues indexes
CREATE INDEX idx_issues_project_id ON issues(project_id);
CREATE INDEX idx_issues_epic_id ON issues(epic_id);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_priority ON issues(priority);
CREATE INDEX idx_issues_parent_issue_id ON issues(parent_issue_id) WHERE parent_issue_id IS NOT NULL;
CREATE INDEX idx_issues_milestone_id ON issues(milestone_id) WHERE milestone_id IS NOT NULL;
CREATE INDEX idx_issues_sort_order ON issues(sort_order);

-- Dependencies indexes
CREATE INDEX idx_dependencies_issue_id ON dependencies(issue_id);
CREATE INDEX idx_dependencies_depends_on_issue_id ON dependencies(depends_on_issue_id);

-- Milestones indexes
CREATE INDEX idx_milestones_user_id ON milestones(user_id);
CREATE INDEX idx_milestones_due_date ON milestones(due_date) WHERE due_date IS NOT NULL;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Check for dependency cycles
-- Returns TRUE if adding the dependency would create a cycle
CREATE OR REPLACE FUNCTION check_dependency_cycle(
    new_issue_id UUID,
    new_depends_on_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    would_create_cycle BOOLEAN;
BEGIN
    -- Use recursive CTE to detect cycles
    WITH RECURSIVE dependency_path AS (
        -- Base case: start with the proposed dependency
        SELECT
            new_issue_id AS issue_id,
            new_depends_on_id AS depends_on_issue_id,
            ARRAY[new_issue_id] AS path

        UNION ALL

        -- Recursive case: follow dependency chain
        SELECT
            d.issue_id,
            d.depends_on_issue_id,
            dp.path || d.issue_id
        FROM dependencies d
        JOIN dependency_path dp ON d.issue_id = dp.depends_on_issue_id
        WHERE NOT (d.issue_id = ANY(dp.path))  -- Prevent infinite recursion
    )
    SELECT EXISTS (
        SELECT 1
        FROM dependency_path
        WHERE depends_on_issue_id = new_issue_id
    ) INTO would_create_cycle;

    RETURN would_create_cycle;
END;
$$ LANGUAGE plpgsql;

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Prevent dependency cycles
CREATE OR REPLACE FUNCTION prevent_dependency_cycle()
RETURNS TRIGGER AS $$
BEGIN
    IF check_dependency_cycle(NEW.issue_id, NEW.depends_on_issue_id) THEN
        RAISE EXCEPTION 'Adding this dependency would create a cycle';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_dependency_cycle_trigger
    BEFORE INSERT ON dependencies
    FOR EACH ROW
    EXECUTE FUNCTION prevent_dependency_cycle();

-- Trigger: Auto-create "Unassigned" epic for new projects
CREATE OR REPLACE FUNCTION create_default_epic()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO epics (project_id, name, status, is_default, sort_order)
    VALUES (NEW.id, 'Unassigned', 'active', TRUE, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_default_epic_trigger
    AFTER INSERT ON projects
    FOR EACH ROW
    EXECUTE FUNCTION create_default_epic();

-- Trigger: Update updated_at on issue changes
CREATE TRIGGER update_issues_updated_at
    BEFORE UPDATE ON issues
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Ensure exactly one default epic per project
CREATE OR REPLACE FUNCTION ensure_one_default_epic()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = TRUE THEN
        -- Unset other default epics in the same project
        UPDATE epics
        SET is_default = FALSE
        WHERE project_id = NEW.project_id
        AND id != NEW.id
        AND is_default = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_one_default_epic_trigger
    BEFORE INSERT OR UPDATE ON epics
    FOR EACH ROW
    EXECUTE FUNCTION ensure_one_default_epic();

-- Trigger: Validate sub-issue project consistency
CREATE OR REPLACE FUNCTION validate_sub_issue_project()
RETURNS TRIGGER AS $$
DECLARE
    parent_project_id UUID;
BEGIN
    IF NEW.parent_issue_id IS NOT NULL THEN
        -- Get parent issue's project_id
        SELECT project_id INTO parent_project_id
        FROM issues
        WHERE id = NEW.parent_issue_id;

        -- Ensure sub-issue is in same project
        IF NEW.project_id != parent_project_id THEN
            RAISE EXCEPTION 'Sub-issue must be in the same project as parent issue';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_sub_issue_project_trigger
    BEFORE INSERT OR UPDATE ON issues
    FOR EACH ROW
    EXECUTE FUNCTION validate_sub_issue_project();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE epics ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE dependencies ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Users can access their own projects"
    ON projects FOR ALL
    USING (auth.uid() = user_id);

-- Epics policies (via project)
CREATE POLICY "Users can access epics in their projects"
    ON epics FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = epics.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Milestones policies
CREATE POLICY "Users can access their own milestones"
    ON milestones FOR ALL
    USING (auth.uid() = user_id);

-- Issues policies (via project)
CREATE POLICY "Users can access issues in their projects"
    ON issues FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = issues.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Dependencies policies (via issues)
CREATE POLICY "Users can access dependencies for their issues"
    ON dependencies FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM issues
            JOIN projects ON projects.id = issues.project_id
            WHERE issues.id = dependencies.issue_id
            AND projects.user_id = auth.uid()
        )
    );

-- ============================================================================
-- SAMPLE DATA (Optional - for development)
-- ============================================================================

-- Uncomment below to insert sample data for development

-- INSERT INTO projects (id, user_id, name) VALUES
--     ('00000000-0000-0000-0000-000000000001', auth.uid(), 'Sample Project');
--
-- INSERT INTO epics (project_id, name, status, is_default) VALUES
--     ('00000000-0000-0000-0000-000000000001', 'Backend', 'active', FALSE),
--     ('00000000-0000-0000-0000-000000000001', 'Frontend', 'active', FALSE);
--
-- INSERT INTO issues (project_id, epic_id, title, status, priority) VALUES
--     ('00000000-0000-0000-0000-000000000001',
--      (SELECT id FROM epics WHERE name = 'Backend' LIMIT 1),
--      'Set up database schema', 'done', 0);
