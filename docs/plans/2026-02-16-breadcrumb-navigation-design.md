# Breadcrumb Navigation Design

**Date:** 2026-02-16
**Status:** Approved
**Context:** Add breadcrumb navigation to show hierarchical context when tree rows are expanded

## Overview

Add a breadcrumb navigation component to the project page header that displays the current path when a tree item (project, epic, or issue) is expanded. The breadcrumb appears in the existing header section alongside the "Edit mode OFF" toggle.

## Requirements

### Functional Requirements

- Display hierarchical path when any tree item is expanded
- Show full path from root with row identifiers (e.g., "P-1 Personal Tasks / E-3 Backend / I-2 Implement authentication API")
- Hide breadcrumb when nothing is expanded (empty space only)
- Read-only display (no click interaction)
- Single expansion constraint: only one item can be expanded at a time

### Visual Requirements

- Lighter/muted appearance compared to tree text
- Use forward slash "/" separators with spacing
- Position to the left of "Edit mode OFF" button in header
- Match tree row font size but with reduced opacity/lighter color
- Reserve space in header whether visible or not

## Design Details

### Placement & Layout

The breadcrumb appears in the existing header section that currently contains "Edit mode OFF". Layout uses flexbox:

- Breadcrumb on left (flex-grow to take available space)
- "Edit mode OFF" button on right (fixed width)

When nothing is expanded, the space remains empty - maintaining consistent layout without visual clutter.

### Breadcrumb Construction

Breadcrumb segments are built by traversing up the hierarchy from the expanded item:

1. Start with expanded row
2. Walk up parent references (issue → epic → project)
3. Reverse to display root-first
4. Format each segment as: `{identifier} {title}`
5. Join with " / " separator

**Examples:**

- Project expanded: `P-1 Personal Tasks`
- Epic expanded: `P-1 Personal Tasks / E-3 Backend`
- Issue expanded: `P-1 Personal Tasks / E-3 Backend / I-2 Implement authentication API`

### Styling Specifications

- Text color: `text-muted-foreground` (Tailwind/shadcn theme token)
- Font size: `text-sm` (matches tree row text)
- Separator: Plain text "/" with `px-2` horizontal padding
- Container: Appropriate vertical padding to align with button

### Component Structure

**State:**

- Leverages existing `expandedRowId` state in TreeGrid.svelte
- Derived/computed breadcrumb value calculated from expanded row

**Reactivity:**

- Breadcrumb auto-updates when `expandedRowId` changes
- Disappears when `expandedRowId` becomes null (collapsed)

**Data Source:**

- Uses same row data already rendered in tree
- Parent references: epic has `project_id`, issue has `epic_id` and `project_id`
- No additional data fetching required

### Edge Cases

- **Top-level project expanded**: Shows just `P-1 Personal Tasks`
- **Epic expanded**: Shows `P-1 Personal Tasks / E-3 Backend`
- **Issue expanded**: Shows full three-level path
- **No expansion**: Empty space, no breadcrumb rendered
- **Mobile**: Breadcrumb wraps or truncates with ellipsis if space constrained

## Implementation Notes

### Files to Modify

- `src/lib/components/tree-grid/TreeGrid.svelte` - Add breadcrumb component and logic

### Key Implementation Steps

1. Add derived breadcrumb computation based on `expandedRowId`
2. Implement hierarchy traversal function
3. Update header section with flexbox layout
4. Add breadcrumb rendering with conditional display
5. Style with muted appearance and separators

## Success Criteria

- Breadcrumb appears when any tree item is expanded
- Shows correct hierarchical path with identifiers
- Disappears when item is collapsed
- Visual style is muted and unobtrusive
- Layout maintains space whether visible or not
- No click interaction (read-only)

## Out of Scope

- Clickable breadcrumb navigation
- Multiple expanded items tracking
- Copy-to-clipboard functionality
- Alternative separator styles
- Mobile-specific breadcrumb treatments beyond basic wrapping
