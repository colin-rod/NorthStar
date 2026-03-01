# Manual Testing Log

Last updated: 2026-03-01

## How to Use This Log

- Run through relevant sections before shipping a feature
- Add entries when building features with no automated test coverage
- Remove entries that are no longer relevant or are now covered by automated tests

---

## Authentication

- [ ] Login with email/password
- [ ] Session persists on page refresh
- [ ] Redirect to login when unauthenticated

## Projects

- [ ] Create project (auto-creates Unassigned epic)
- [ ] Archive/unarchive project
- [ ] Project appears in Projects view tree grid

## Epics

- [ ] Create epic in project
- [ ] Edit epic name and status
- [ ] Default "Unassigned" epic cannot be deleted

## Issues

- [ ] Create issue (all required fields: title, project, epic, status, priority)
- [ ] Edit issue title, status, priority, story points, milestone
- [ ] Create sub-issue (inherits parent's epic)
- [ ] Drag to reorder issues
- [ ] Issue sheet opens and closes correctly

## Dependencies

- [ ] Add dependency between issues
- [ ] Cycle detection blocks invalid dependency with error message
- [ ] Blocked indicator shows on issue with active (non-done) dependencies
- [ ] Completing a dependency removes blocked state from dependent issue

## Projects View (Tree Grid)

- [ ] Filter by project status, epic status, issue priority/status
- [ ] Group by priority / status / story points / milestone
- [ ] Sort by priority / status / name / story points
- [ ] URL params preserved on page refresh
- [ ] Collapsible filter panel hides/shows correctly

## Home View

- [ ] Todo tab shows only ready issues (status=todo AND not blocked)
- [ ] In Progress tab shows doing issues
- [ ] Blocked tab shows blocked issues
- [ ] Done tab shows done issues
- [ ] Project filter narrows results correctly

## Mobile

- [ ] Bottom sheets open and close correctly on small screens
- [ ] No horizontal overflow / scroll on narrow viewports
- [ ] Touch targets are usable without zooming
