# NorthStar Project Memory

## Project Overview

Single-user project management app. SvelteKit + Supabase + shadcn/svelte + Tailwind CSS. Deployed on Vercel.
No local Supabase — all DB work against remote. Use `npx supabase db push` for migrations.

## Key Commands

- `npm run dev` — dev server (localhost:5173)
- `npm run check` — svelte-check type checking
- `npm run lint` — eslint
- `npm run test` — vitest

## Design System

### Shared Components (created during normalization)

- `src/lib/components/ProgressBar.svelte` — thin progress bar (h-[3px], bg-muted track, bg-foreground/40 fill). Props: `percentage: number`, `label?: boolean`, `ariaLabel?: string`
- `src/lib/components/IssueCountsBadges.svelte` — 6-badge grid (Ready/Doing/In Review/Blocked/Done/Canceled). Prop: `counts: IssueCounts`. NOTE: named `IssueCountsBadges` not `IssueCounts` to avoid clash with the `IssueCounts` type from `$lib/utils/issue-counts`
- `src/lib/components/LoadingOverlay.svelte` — absolute overlay with spinner, no props

### CSS Utility

- `.section-header` in `app.css` `@layer components` — replaces the repeated `text-xs uppercase font-medium text-foreground-muted mb-3 tracking-wide` pattern across sheets

### Design Tokens (app.css + tailwind.config.js)

- Background: `bg-background` (#FAF9F6), surfaces: `bg-surface` (white), hover: `bg-surface-subtle`
- Brand: `primary` (burnt orange #C2410C), `primary-hover`, `primary-tint`
- Status colors: `status-todo`, `status-doing`, `status-in-review`, `status-done`, `status-blocked`, `status-blocked-strong`, `status-canceled`
- Semantic tints: `bg-done`, `bg-blocked`, `bg-review`
- Text: `foreground`, `foreground-secondary`, `foreground-muted`, `foreground-disabled`
- Borders: `border`, `border-divider`
- Typography: `text-page-title`, `text-section-header`, `text-issue-title`, `text-body`, `text-metadata`
- Border radius: `rounded-sm` (6px), `rounded-md` (10px), `rounded-lg` (20px drawer)
- Shadows: `shadow-level-1`, `shadow-level-2`
- Fonts: Inter (UI), Fraunces (accent/branding)

### Utility Functions (use these, don't redeclare locally)

- `formatStatus(status)` — `src/lib/utils/design-tokens.ts` — 'in_review' → 'In Review'
- `getStatusDotClass(status)` — same file — returns `bg-status-*` class for colored dots
- `getStatusBadgeVariant(status)` — same file — returns `'status-todo'|'status-doing'|...` for Badge variant prop
- `getEpicStatusVariant(status)` — same file — for epic status badges
- `getPriorityLabel(priority)` — same file — 0 → 'P0', etc.

### Key Patterns

- Progress bars: always `h-[3px]` height, `bg-muted` track, `bg-foreground/40` fill — use `ProgressBar` component
- Section headers in sheets: always use `<h3 class="section-header">` CSS class
- Status dots in rows: `w-2 h-2 md:w-3 md:h-3 rounded-full` — responsive sizing is intentional
- Row hover: `hover:bg-surface-subtle` for list rows; `hover:bg-muted` for inline item buttons
- Loading overlays: use `LoadingOverlay` component
- EmptyState positive variant: uses `bg-status-done/10 text-status-done` (not emerald)

## Architecture Notes

- Route structure: `src/routes/(protected)/` for authenticated pages
- Home page: `+page.svelte` — shows Ready/Doing/Blocked/Done issue tabs
- Projects page: `/projects/+page.svelte` — tree grid with filtering/sorting/grouping
- Issue data hierarchy: Projects → Epics → Issues → Sub-issues (parent_issue_id)
- Blocked = issue has ≥1 dependency NOT in (done, canceled); in_review counts as blocking
- "Ready" = todo + not blocked (computed, not stored)

## Gotchas

- `IssueCounts` is both a type (from `$lib/utils/issue-counts`) and was attempted as a component name — always name the component `IssueCountsBadges` to avoid the identifier clash
- h1-h6 elements get `font-family: Fraunces` from app.css base styles — section-header uses Inter via explicit font-family override
- Story points restricted to: 1, 2, 3, 5, 8, 13, 21 (nullable) — `ALLOWED_STORY_POINTS` in `$lib/utils/issue-helpers`
- No Docker/local Supabase — remote only
