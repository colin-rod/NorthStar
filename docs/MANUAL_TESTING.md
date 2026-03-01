# Manual Testing Log

Last updated: 2026-03-01

## How to Use This Log

- Run through relevant sections before shipping a feature
- Add entries when building features with no automated test coverage
- Remove entries that are no longer relevant or are now covered by automated tests

---

## Authentication

- [ ] Login with email/password succeeds and redirects to home
- [ ] Login with wrong password shows error message
- [ ] Session persists on page refresh
- [ ] Unauthenticated user is redirected to login page
- [ ] Logout (via Settings) clears session and redirects to login

---

## Navigation

- [ ] Side nav (desktop): Home, Projects, Settings links work
- [ ] Side nav (desktop): Active page is highlighted
- [ ] Bottom nav (mobile): Home, Projects, Search icons work
- [ ] Bottom nav (mobile): Active page icon is highlighted (burnt orange)
- [ ] Navigating between pages does not lose URL filter state unexpectedly

---

## Search

- [ ] Search modal opens (mobile: tap search icon in bottom nav)
- [ ] Search input is auto-focused when modal opens
- [ ] Typing filters issues in real time (matches title, project name, epic name)
- [ ] Clicking a search result opens IssueSheet for that issue
- [ ] Esc key closes the search modal
- [ ] Clicking outside the modal closes it

---

## New Button Dropdown

- [ ] "New Project" option opens ProjectDetailSheet in create mode
- [ ] "New Epic" option opens EpicDetailSheet in create mode (only shown if projects exist)
- [ ] "New Issue" option opens IssueSheet in create mode (only shown if epics exist)
- [ ] Submitting create form transitions sheet to edit mode

---

## Projects

- [ ] Create project: name is required, submit creates project and auto-creates "Unassigned" epic
- [ ] Newly created project appears in Projects view tree grid
- [ ] Project gets an auto-incremented number on creation
- [ ] Edit project name: change saves automatically
- [ ] Edit project status (active/done/canceled): change saves automatically
- [ ] Edit project description (rich text): change saves automatically
- [ ] Archive project: right-click → Archive → confirmation dialog → project removed from main view
- [ ] Delete project: right-click → Delete → confirmation dialog → project removed
- [ ] Unarchive project: Settings → Archived Projects → Restore → project reappears in tree grid
- [ ] Archived projects list shows archive date

---

## Epics

- [ ] Create epic via New button dropdown: name is required, project is required
- [ ] Create epic via context menu (right-click project → Add Epic)
- [ ] Epic gets auto-incremented number on creation
- [ ] Edit epic name: auto-saves
- [ ] Edit epic status (active/done/canceled): auto-saves
- [ ] Edit epic priority (P0-P3): auto-saves
- [ ] Assign milestone to epic: auto-saves
- [ ] Remove milestone from epic: auto-saves
- [ ] Edit epic description (rich text): auto-saves
- [ ] Delete epic: issues in that epic are reassigned to project's "Unassigned" epic (not deleted)
- [ ] Default "Unassigned" epic cannot be deleted
- [ ] Epic detail sheet shows issues list with count by status and progress bar

---

## Issues

- [ ] Create issue: title, project, epic, status, priority are required
- [ ] Issue gets auto-incremented number on creation
- [ ] Edit issue title: auto-saves
- [ ] Edit issue status (todo/doing/in_review/done/canceled): auto-saves
- [ ] Edit issue priority (P0-P3): auto-saves
- [ ] Edit issue story points: only 1, 2, 3, 5, 8, 13, 21 are accepted; null is accepted
- [ ] Edit issue epic: auto-saves (changes which epic issue belongs to)
- [ ] Assign milestone to issue: auto-saves
- [ ] Remove milestone from issue: auto-saves
- [ ] Edit issue description (rich text): auto-saves with debounce
- [ ] Save state feedback shows: "saving..." → "saved" → resets
- [ ] Delete issue: right-click or sheet delete button → confirmation → removed from list
- [ ] "In Progress" displayed in UI for issues with status `doing`

---

## Sub-Issues

- [ ] Create sub-issue: expand parent issue in sheet → inline form → title is required
- [ ] Sub-issue inherits parent's epic automatically (epic field disabled in sheet)
- [ ] Sub-issue must be in same project as parent
- [ ] Sub-issue count badge appears on parent IssueRow
- [ ] Expand/collapse sub-issues via chevron on parent IssueRow
- [ ] Edit sub-issue fields (same as issue except epic is locked)
- [ ] Delete sub-issue via sheet or context menu

---

## Dependencies

- [ ] Open issue sheet → Dependencies section → "Add Dependency" button opens dialog
- [ ] Dependency dialog: typing filters available issues in real time
- [ ] Self-dependency is not offered as an option
- [ ] Existing dependencies are excluded from options
- [ ] Adding a valid dependency saves and shows in "Blocked by" list
- [ ] Cycle detection: adding a dependency that would create a cycle shows an error and does not save
- [ ] Issue shows blocked indicator (lock icon, red) when it has active dependencies
- [ ] Issue blocked state clears when all dependencies are done or canceled
- [ ] Canceled dependencies appear as "satisfied" (visually distinct) — do not block
- [ ] `in_review` dependencies DO block (issue still shows as blocked)
- [ ] Remove dependency: click X on dependency row → dependency removed
- [ ] Blocked indicator appears on IssueRow in all views (home, epic page, projects tree grid)

---

## Milestones

- [ ] Create milestone: name required (1-100 chars), due date optional
- [ ] Edit milestone name and due date
- [ ] Assign milestone to issue via MilestonePicker in issue sheet
- [ ] Assign milestone to epic via MilestonePicker in epic sheet
- [ ] Milestone with due date shows date in picker and progress summary
- [ ] Clear milestone from issue/epic (set to null)
- [ ] Filter home view by milestone (multi-select)
- [ ] "No Milestone" filter option shows issues without a milestone
- [ ] Progress summary shows milestone name and due date when single milestone is filtered

---

## Attachments

- [ ] Upload attachment to issue: file input opens, file uploads, appears in list with name and size
- [ ] Upload attachment to epic: same behavior
- [ ] Upload attachment to project: same behavior
- [ ] Attachment shows download link (signed URL)
- [ ] "Uploading..." indicator shows during upload
- [ ] Delete attachment: remove button → attachment removed from list
- [ ] Signed URLs expire (1-hour); refreshed on component mount

---

## Rich Text Editor

- [ ] Description field shows placeholder text when empty
- [ ] Formatting toolbar: Bold, Italic, Underline, Heading, List, Quote work
- [ ] Content auto-saves on change (debounced)
- [ ] Save state feedback visible during save
- [ ] Clearing description saves as null (not empty string)
- [ ] Description persists on sheet close and reopen

---

## Home View

### View Toggle

- [ ] "Sectioned" view (default): groups issues by Ready / Doing / Blocked / Done tabs
- [ ] "All" view: flat or grouped list based on group-by selection
- [ ] View toggle button switches between modes
- [ ] View mode persists in URL (`?view=sectioned` or `?view=all`)

### Sectioned View

- [ ] Ready tab: shows only todo issues that are NOT blocked
- [ ] Doing tab: shows issues with status `doing`
- [ ] Blocked tab: shows issues that are blocked
- [ ] Done tab: shows issues with status `done`

### Filters

- [ ] Project filter: multi-select, narrows results to selected projects
- [ ] Priority filter: P0-P3 buttons, multi-select
- [ ] Milestone filter: multi-select dropdown, includes "No Milestone" option
- [ ] Status filter: multi-select, includes virtual "Ready" and "Blocked" statuses
- [ ] Story Points filter: multi-select buttons (1,2,3,5,8,13,21 + None)
- [ ] All active filters persist in URL params on page refresh
- [ ] Multiple filters combine (AND logic)

### Grouping (All view)

- [ ] Group by: None, Project, Status, Priority, Milestone, Story Points
- [ ] GroupHeader shows: group name, issue count, total story points, completion %
- [ ] GroupHeader is expandable/collapsible
- [ ] Group-by selection persists in URL

### Sorting (All view)

- [ ] Sort by: Priority, Status, Title, Project, Epic, Milestone, Story Points
- [ ] Sort direction toggle (asc/desc)
- [ ] Sort selection persists in URL

### Progress Summary

- [ ] Shows when a single milestone is filtered
- [ ] Displays: milestone name, due date, progress bar, issue counts by status

### Empty States

- [ ] No projects exist: shows "Create a project" CTA
- [ ] Projects exist but no issues: shows "New Issue" CTA
- [ ] Filters active but no results: shows "Clear filters" CTA

---

## Projects View (Tree Grid)

### Expansion / Collapse

- [ ] Click chevron or row to expand a project (shows its epics)
- [ ] Expanding a project collapses previously expanded project
- [ ] Click chevron or row to expand an epic (shows its issues)
- [ ] Expanding an epic collapses previously expanded epic
- [ ] Expanded project and epic IDs persist in URL (`?project=<id>&epic=<id>`)
- [ ] Page refresh restores same expanded state

### Filters

- [ ] Filter panel toggle button shows/hides filter panel
- [ ] Filter panel shows count badge when filters are active
- [ ] Project Status filter: active, done, canceled checkboxes
- [ ] Epic Status filter: active, done, canceled checkboxes
- [ ] Issue Priority filter: P0, P1, P2, P3 checkboxes
- [ ] Issue Status filter: todo, doing, in_review, done, canceled checkboxes
- [ ] Story Points filter: 1, 2, 3, 5, 8, 13, 21, None checkboxes
- [ ] All filter selections persist in URL params on page refresh

### Grouping (Issues within Epics)

- [ ] Group by: None, Priority, Status, Story Points, Milestone
- [ ] GroupHeader rows appear between groups showing: name, count, points, completion %
- [ ] GroupHeader is collapsible
- [ ] Group-by persists in URL

### Sorting

- [ ] Sort by: Priority, Status, Title, Story Points, Progress
- [ ] Sort direction: ascending/descending toggle
- [ ] Projects and epics sorted by aggregate metrics (highest priority issue, total points, completion %)
- [ ] Sort selection persists in URL

### Inline Editing

- [ ] Edit mode toggle button enables cell-level editing
- [ ] TitleCell: click to edit name/title, saves on blur
- [ ] StatusCell: dropdown to change status, saves on change
- [ ] PriorityCell: dropdown P0-P3, saves on change
- [ ] StoryPointsCell: dropdown, saves on change
- [ ] MilestoneCell: milestone picker, saves on change

### Context Menu (Right-click)

- [ ] Right-click project: Rename, Status submenu, Add Epic, Archive, Delete
- [ ] Right-click epic: Rename, Status, Priority submenu, Milestone submenu, Add Issue, Delete
- [ ] Right-click issue: Status submenu, Priority submenu, Story Points submenu, Add Sub-issue, Delete
- [ ] Destructive actions (delete, archive) show confirmation dialog before executing
- [ ] All context menu actions produce success or error toast

### Drag and Drop

- [ ] Drag handle visible on hover (left side of row)
- [ ] Drag issue to reorder within same epic
- [ ] Drag epic to reorder within same project
- [ ] Drag epic to different project (reparent)
- [ ] Drag issue to different epic (reparent)
- [ ] Drag sub-issue to different parent issue (reparent)
- [ ] Visual drop zone indicator shows valid drop target

### Inline Creation (AddRow)

- [ ] "Add Epic" row appears in expanded project
- [ ] "Add Issue" row appears in expanded epic
- [ ] "Add Sub-issue" row appears in expanded issue
- [ ] Submitting inline form creates entity and it appears in the tree

### Sheets from Tree Grid

- [ ] Double-click project row opens ProjectDetailSheet in edit mode
- [ ] Double-click epic row opens EpicDetailSheet in edit mode
- [ ] Double-click issue row opens IssueSheet in edit mode

---

## Epic Page (`/epics/[id]`)

- [ ] Page loads with epic's issues
- [ ] Filter tabs: All, Todo, Doing, In Review, Blocked, Done, Canceled
- [ ] Active tab filter persists in URL (`?filter=<value>`)
- [ ] Tab counts update to reflect actual issue counts
- [ ] "Todo" tab count shows ready issues only (todo + not blocked)
- [ ] Blocked indicator shown on blocked issues
- [ ] Click issue row opens IssueSheet
- [ ] Drag handle to reorder issues within epic
- [ ] Up/down arrow buttons to reorder issues
- [ ] Inline "Add Issue" form at bottom of list
- [ ] Sub-issues expand/collapse with chevron on IssueRow

---

## Settings

- [ ] Settings page shows signed-in email (read-only)
- [ ] Logout button clears session and redirects to login
- [ ] Archived Projects section lists all archived projects with archive date
- [ ] "Restore" button on archived project unarchives it and removes from archived list
- [ ] Restored project reappears in Projects view
- [ ] Theme, Notifications, Data & Privacy sections show "Coming soon" placeholder

---

## Sheets (General Behavior)

- [ ] Sheet opens from relevant trigger (row click, button, context menu)
- [ ] Sheet closes via close button (X)
- [ ] Sheet closes via backdrop click (where applicable)
- [ ] Esc key closes sheet
- [ ] Create mode: submitting form transitions sheet to edit mode for the new entity
- [ ] Desktop: sheet opens as right-side drawer
- [ ] Desktop: expand button transitions sheet to center/peek mode
- [ ] Desktop: collapse button returns to side drawer mode
- [ ] Mobile: sheet opens as bottom sheet
- [ ] Mobile: sheet height is keyboard-aware (adjusts when keyboard appears)
- [ ] Save state feedback (saving.../saved) visible during auto-save operations

---

## Empty States

- [ ] Home view with no projects: shows icon, message, and "Create a project" button
- [ ] Home view with projects but no issues: shows icon, message, and "New Issue" button
- [ ] Home view with active filters and no results: shows "Clear filters" CTA
- [ ] Projects view tree grid with no projects: shows appropriate empty state
- [ ] Epic page with no issues: shows empty state with add issue prompt

---

## Mobile

- [ ] Bottom nav visible and usable on narrow viewports
- [ ] No horizontal overflow or unintended scroll on any page
- [ ] Issue sheet opens as bottom sheet (not side drawer)
- [ ] Bottom sheet adjusts height when keyboard is visible
- [ ] Touch targets are large enough to tap accurately
- [ ] Tree grid rows are tappable and open correct sheets
- [ ] Filter panel opens and closes on mobile
- [ ] Drag-and-drop reordering is usable on touch devices

---

## Accessibility

- [ ] All icon-only buttons have accessible labels (aria-label or title)
- [ ] Active nav links have aria-current="page"
- [ ] Success messages use aria-live="polite"
- [ ] Error messages use aria-live="assertive"
- [ ] Tab key navigates through form fields in logical order
- [ ] Esc key closes modals and sheets
- [ ] Focus is managed correctly when sheets open and close (returns to trigger)
- [ ] Blocked status is communicated via text/icon, not color alone
- [ ] Priority badges are readable without relying solely on color
