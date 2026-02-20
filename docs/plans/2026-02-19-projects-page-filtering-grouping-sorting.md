# Projects Page: Filtering, Grouping, and Sorting

**Date:** 2026-02-19
**Status:** Design Complete, Ready for Implementation

## Overview

Add comprehensive filtering, grouping, and sorting capabilities to the projects page while maintaining its hierarchical tree structure (Projects → Epics → Issues → Sub-issues). Controls will be collapsible to preserve screen space.

## Design Decisions

### Filter Mode: Multi-Level Filtering

Filters apply at all levels of the hierarchy (projects, epics, issues), creating a focused hierarchical view. Each level filters independently:

- **Project filters:** Status (active/done/canceled), Milestone
- **Epic filters:** Status (active/done/canceled), Milestone
- **Issue filters:** Priority (P0-P3), Status (todo/doing/in_review/done/canceled), Story Points, Milestone

### Grouping: Secondary Grouping Within Tree Levels

The tree structure remains intact. Grouping adds sub-grouping within expanded epics:

```
Project: Personal Tasks
  ├─ Epic: Unassigned
  │   ├─ [P0] (group header)
  │   │   ├─ Issue: Fix critical bug
  │   │   └─ Issue: Deploy hotfix
  │   ├─ [P1] (group header)
  │   │   └─ Issue: Refactor auth
```

**Grouping Options:**

- None (default)
- Priority (P0, P1, P2, P3)
- Status (Todo, Doing, In Review, Done, Canceled)
- Milestone (by milestone name)
- Story Points (1, 2, 3, 5, 8, 13, 21, None)

### Sorting: Context-Aware Multi-Level Sorting

Sorting applies at all three levels with context-aware comparison:

- **Priority:** Projects by highest priority issue, epics by highest priority issue, issues by their priority
- **Status:** Custom status order at all levels
- **Name/Title:** Alphabetical at all levels
- **Progress:** Projects/epics by completion percentage
- **Story Points:** Projects/epics by total, issues by their value

### UI: Collapsible Filter Panel

Filter controls hidden by default in collapsible panel to preserve screen space. Grouping and sorting controls always visible.

## Architecture

### Components

**New Components:**

1. **`FilterPanel.svelte`** - Collapsible panel with all filter controls
   - Sections: Project Filters, Epic Filters, Issue Filters
   - Reuses existing filter components from home page
   - "Clear all filters" functionality

2. **`ProjectStatusFilter.svelte`** - Filter for project status
3. **`EpicStatusFilter.svelte`** - Filter for epic status
4. **`GroupHeader.svelte`** - Render group header rows in tree
5. **`IssueGroupBySelector.svelte`** - Grouping selector for issues

**Modified Components:**

1. **`/routes/(protected)/projects/+page.svelte`** - Add UI controls
2. **`/routes/(protected)/projects/+page.server.ts`** - Parse URL params, apply filters
3. **`TreeGrid.svelte`** - Render filtered/grouped/sorted data

### Data Flow

```
URL params → +page.server.ts (parse filters)
            ↓
Load all projects/epics/issues from DB
            ↓
Apply filters at each level (server-side)
            ↓
Return filtered tree to client
            ↓
Client applies grouping + sorting (reactive)
            ↓
TreeGrid renders with group headers
```

### State Management

- **URL params:** Filter values, grouping mode, sort column/direction
- **Component state:** Filter panel open/closed (sessionStorage)
- **Existing:** Tree expansion state (unchanged)

## UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Projects                           [Filters ▼] [Edit mode]  │
│                                              [NewButtonDropdown]│
├─────────────────────────────────────────────────────────────┤
│ ┌─ Filters ────────────────────────────────────────────────┐│
│ │                                                           ││
│ │ Project Filters:                                         ││
│ │ [Project Status ▼] [Project Milestone ▼]                ││
│ │                                                           ││
│ │ Epic Filters:                                            ││
│ │ [Epic Status ▼] [Epic Milestone ▼]                      ││
│ │                                                           ││
│ │ Issue Filters:                                           ││
│ │ [Priority ▼] [Status ▼] [Story Points ▼] [Milestone ▼] ││
│ │                                                           ││
│ │                                        [Clear all filters]││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
│ Group by: [None ▼]    Sort: [Priority ↑]                   │
│                                                              │
│ [Tree Grid content...]                                       │
└─────────────────────────────────────────────────────────────┘
```

## Filtering Logic

### Cascading Filters

Filters cascade top-down through the hierarchy:

```typescript
function filterTree(projects, filters) {
  return projects
    .filter((project) => matchesProjectFilters(project, filters.project))
    .map((project) => ({
      ...project,
      epics: project.epics
        .filter((epic) => matchesEpicFilters(epic, filters.epic))
        .map((epic) => ({
          ...epic,
          issues: epic.issues
            .filter((issue) => matchesIssueFilters(issue, filters.issue))
            .map((issue) => ({
              ...issue,
              subIssues: issue.subIssues?.filter((sub) => matchesIssueFilters(sub, filters.issue)),
            })),
        })),
    }));
}
```

### Filter Behavior

- If a project is filtered out, all its children are hidden
- If an epic is filtered out, all its issues are hidden
- Empty parents remain visible (show "(no items)" message when expanded)
- Enables understanding why results are empty

### URL State

Filter values stored in URL for deep-linking:

```
?project_status=active&epic_status=active,done&priority=0,1&status=todo,doing
```

## Grouping Logic

### Group Header Rendering

When grouping is active (e.g., "Group by Priority"), issues within each epic are organized into sub-groups:

```typescript
// Grouping happens after filtering, before sorting
function groupIssues(issues, groupBy) {
  if (groupBy === 'none') return [{ items: issues }];

  const groups = {};
  for (const issue of issues) {
    const key = getGroupKey(issue, groupBy);
    if (!groups[key]) groups[key] = [];
    groups[key].push(issue);
  }

  return Object.entries(groups)
    .sort(compareGroupKeys)
    .map(([key, items]) => ({ label: key, items }));
}
```

### Group Headers in Tree

- Rendered as sub-rows within TreeGrid
- Non-interactive (can't select/edit)
- Show label + count (e.g., "P0 · 3 issues")
- Styled distinctly (muted, smaller text)

### Sorting Within Groups

Issues within each group are sorted according to the sort selector. Groups themselves sorted in sensible order (P0 before P1, etc.).

## Sorting Logic

### Context-Aware Comparison

```typescript
function sortByPriority(direction) {
  return {
    projects: (a, b) => compareByHighestPriority(a.issues, b.issues, direction),
    epics: (a, b) => compareByHighestPriority(a.issues, b.issues, direction),
    issues: (a, b) => comparePriority(a.priority, b.priority, direction),
  };
}

function sortByStatus(direction) {
  const statusOrder = ['todo', 'doing', 'in_review', 'done', 'canceled'];
  return {
    projects: (a, b) => compareStatus(a.status, b.status, statusOrder, direction),
    epics: (a, b) => compareStatus(a.status, b.status, statusOrder, direction),
    issues: (a, b) => compareStatus(a.status, b.status, statusOrder, direction),
  };
}
```

### Sort Direction

- Toggle (↑↓) applies to all levels
- Default: "Sort by Priority ↑" (P0 first)

## Testing Strategy

### Unit Tests

- `filter-tree.test.ts` - Cascading filter logic at all levels
- `group-issues.test.ts` - Grouping logic (all modes)
- `sort-tree.test.ts` - Context-aware sorting at each level
- `filter-url-params.test.ts` - URL param parsing/serialization

### Component Tests

- `FilterPanel.test.ts` - Panel open/close, clear all
- `ProjectStatusFilter.test.ts` - Project status filtering
- `EpicStatusFilter.test.ts` - Epic status filtering
- `GroupHeader.test.ts` - Group header rendering

### Integration Tests

- `projects-page-filtering.test.ts` - End-to-end filtering with URL updates
- `projects-page-grouping.test.ts` - Grouping with tree structure
- `projects-page-sorting.test.ts` - Multi-level sorting

### Edge Cases

**Empty States:**

- No projects match filters → "No projects found"
- Epic has no issues after filtering → "(no issues)" in expanded epic
- Group has no items → Don't render empty group headers

**Filter Combinations:**

- All filters active → Ensure performance stays good
- Conflicting filters → Show empty set
- Clear filters → Reset to unfiltered state

**Grouping Edge Cases:**

- Issues with null values → "No Milestone" group
- Single issue in group → Still show group header
- Group by None + Sort → Issues sorted directly

**Sorting Edge Cases:**

- Null story points → Sort to end (or beginning based on direction)
- Same priority → Secondary sort by title
- Projects with no issues → Sort to end

**URL State:**

- Invalid filter values → Ignore, use defaults
- Very long URLs → Browser handles it (~2000 chars max)
- Share filtered URL → Recipient sees same view

### Performance Considerations

- Client-side filtering/grouping/sorting for <500 issues (per CLAUDE.md)
- Use `$derived.by()` for reactive computed values
- Avoid re-rendering entire tree on filter change

### Coverage Requirements

- **Minimum 80% code coverage** for business logic
- **100% coverage** for critical paths:
  - Filter cascading logic
  - Group header rendering
  - Sort comparison functions

## Implementation Phases

### Phase 1: Foundation (Core Filtering)

- Add URL param parsing to `+page.server.ts`
- Implement cascading filter logic (server-side)
- Add FilterPanel component (collapsed by default)
- Add Project/Epic/Issue status filters
- Test filtering at all three levels

### Phase 2: Advanced Filters

- Add Priority, Milestone, Story Points filters for issues
- Integrate existing filter components from home page
- Test filter combinations and edge cases

### Phase 3: Grouping

- Implement issue grouping logic (client-side)
- Add GroupHeader component
- Update TreeGrid to render group headers
- Add GroupBySelector control

### Phase 4: Sorting

- Implement context-aware sorting at all levels
- Add SortBySelector control
- Test sorting with grouping active

### Phase 5: Polish & Performance

- Performance testing with ~500 issues
- Accessibility improvements (keyboard navigation)
- Mobile responsiveness for filter panel
- Documentation updates

## Backward Compatibility

- Default state (no filters, no grouping, sort by priority) matches current behavior
- Existing URL params (project=X, epic=Y) continue to work
- Filter panel starts collapsed
- Tree grid behavior unchanged when filters inactive

## User Experience

- First-time users see clean interface (filters hidden)
- "Filters" button with badge showing active filter count
- Filter panel state persisted in sessionStorage
- Smooth transitions when expanding/collapsing panel
- Clear visual feedback when filters are active

## Technical Notes

### URL Param Schema

```
# Project filters
?project_status=active,done
?project_milestone=milestone-id-1,milestone-id-2

# Epic filters
?epic_status=active
?epic_milestone=milestone-id-3

# Issue filters
?priority=0,1
?status=todo,doing
?story_points=1,2,3,none
?milestone=milestone-id-4,milestone-id-5

# Grouping & Sorting
?group_by=priority
?sort_by=priority
?sort_dir=asc
```

### Filter Component Reuse

Leverage existing components from home page:

- `PriorityFilter.svelte` (for issues)
- `StatusFilter.svelte` (for issues)
- `StoryPointsFilter.svelte` (for issues)
- `MilestoneFilter.svelte` (for projects/epics/issues)

Create new status filters specific to projects/epics since they have different status enums.

### Group Header Data Structure

```typescript
type GroupHeader = {
  type: 'group-header';
  label: string; // "P0", "Todo", "Sprint 1", etc.
  count: number; // Number of items in group
  groupKey: string; // For sorting/comparison
};
```

## Success Metrics

- Users can filter projects page by all relevant dimensions
- Tree structure remains intact with filters active
- Performance remains good with ~500 issues
- Filter state is shareable via URL
- UI doesn't feel cluttered (collapsible panel)
- 80%+ test coverage on new logic

## Open Questions

None - design complete and validated.
