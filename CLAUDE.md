# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**NorthStar** is a single-user project management application designed to manage multiple personal projects without team collaboration overhead. It provides hierarchical work breakdown (Projects → Epics → Issues → Sub-issues) with explicit dependency tracking and mobile-first editing.

**Core Purpose**: Clearly identify what to work on next, with dependencies never forgotten or implicit.

## Coding Principles

These principles guide all development work in NorthStar. They complement the TDD methodology described later and help avoid common pitfalls when building features.

### Principle 1: Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing any feature:

- State your assumptions explicitly. If uncertain, ask clarifying questions.
- If multiple interpretations exist, present them rather than choosing silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

**NorthStar Example**: When asked to "add dependency cycle detection":

- ❌ Don't assume: Silently implement PostgreSQL recursive CTE without asking where to show errors
- ✅ Do clarify: "Should cycle errors appear during dependency creation (blocking), or as validation warnings in the UI? Should we show the cycle path to help users understand the issue?"

### Principle 2: Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

**NorthStar Example**: When implementing issue status filters:

- ❌ Don't overcomplicate: Create a flexible FilterBuilder class with chainable methods, configuration files, and support for custom filter expressions
- ✅ Do simplify: Use Svelte's reactive `$:` statements to filter issues based on status equality: `$: filteredIssues = issues.filter(i => i.status === selectedStatus)`

### Principle 3: Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

The test: Every changed line should trace directly to the user's request.

**NorthStar Example**: When fixing a bug in issue sorting by priority:

- ❌ Don't expand scope: Fix the sort bug AND convert the component to TypeScript AND add JSDoc comments AND refactor variable names AND update the entire file to use `const` instead of `let`
- ✅ Do stay surgical: Change only the comparison function: `issues.sort((a, b) => a.priority - b.priority)` → `issues.sort((a, b) => b.priority - a.priority)` (P0 first)

### Principle 4: Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform vague tasks into verifiable goals with explicit verification steps:

- "Add validation" → "Write tests for invalid inputs (story points = 4), then make them pass"
- "Fix the bug" → "Write a test that reproduces blocked state calculation error, then make it pass"
- "Refactor X" → "Ensure all tests pass before and after refactoring"

For multi-step tasks, state a brief plan with verification checkpoints.

**NorthStar Example**: When implementing sub-issues feature:

```
1. Add parent_issue_id column → verify: migration applies without errors
2. Update RLS policies for sub-issues → verify: test that sub-issues inherit parent's project access
3. Add sub-issues UI in IssueSheet → verify: can create sub-issue, appears in parent's collapsible list
4. Test epic inheritance → verify: sub-issue automatically gets parent's epic_id
```

---

**For detailed examples across various scenarios, reference the `karpathy-principles` skill.**

These principles work with TDD:

- **Think Before Coding** → Write failing test first (TDD Red: understand requirements)
- **Simplicity First** → Minimal code to pass test (TDD Green: avoid over-engineering)
- **Surgical Changes** → Refactor only after tests pass (TDD Refactor: preserve working code)
- **Goal-Driven Execution** → Test-driven verification loops (TDD: measurable success)

## Tech Stack

**Frontend:**

- **SvelteKit** - Fast, lightweight framework chosen for minimal JavaScript payload and mobile-first performance
- **shadcn/svelte** - Accessible, customizable component library built on Melt UI primitives
- **Tailwind CSS** - Utility-first styling for rapid mobile-first development

**Backend/Database:**

- **Supabase** - PostgreSQL database with built-in Auth, real-time capabilities, and REST API
- **Supabase Auth** - Email/password authentication with magic links and OAuth support

**Deployment:**

- **Vercel** - Optimized for SvelteKit with automatic deployments and edge functions

**Rationale**: This stack prioritizes speed, lightweight bundle size, and mobile performance while providing a complete backend solution with minimal configuration.

## Core Data Model

### Hierarchy

```
Projects (top-level containers)
  └─ Epics (thematic groupings)
       └─ Issues (primary unit of work)
            └─ Sub-issues (child issues)
```

### Entities

**Project**

- Top-level container for work
- Contains multiple epics
- Auto-creates one "Unassigned" epic

**Epic**

- Project-scoped thematic grouping
- Status: `active`, `done`, `canceled`
- Each project has exactly one default "Unassigned" epic

**Issue**

- Primary unit of work
- Required fields: title, project, epic, status, priority, sort_order
- Optional fields: parent_issue_id (for sub-issues), milestone, story_points, dependencies
- Status: `todo`, `doing`, `in_review`, `done`, `canceled`
- Priority: Integer scale (P0-P3)
- Story Points: Restricted to: 1, 2, 3, 5, 8, 13, 21 (nullable)

**Sub-Issue**

- An issue with a `parent_issue_id`
- Must be in same project as parent
- Inherits parent's epic

**Milestone**

- Global (cross-project) reusable label
- Optional due date
- Each issue can have at most one milestone

**Dependency**

- Directed relationship: "Issue A depends on Issue B"
- Stored as: `(issue_id, depends_on_issue_id)`
- Can span across epics and projects

## Business Logic

### Computed States

**Blocked**: An issue has ≥1 dependency with status NOT in (`done`, `canceled`)

- Note: `in_review` counts as NOT done (still blocks)

**Ready**: An issue that is:

- Status = `todo`
- NOT Blocked

These states are computed dynamically, not stored in database.

### Dependency Semantics

1. Dependencies create blocking relationships
2. `canceled` dependencies are treated as satisfied but surfaced visually
3. **Cycle prevention is critical**: System must prevent circular dependencies
4. Dependency creation must fail if it would introduce a cycle
5. No self-dependencies allowed

### Data Integrity Rules

**Enforce these constraints:**

- Every issue MUST belong to an epic (non-null)
- Sub-issues MUST belong to same project as parent
- Exactly one "Unassigned" epic per project
- No circular dependencies in dependency graph
- Story points restricted to allowed set: 1, 2, 3, 5, 8, 13, 21
- No self-dependencies

## Architecture Principles

### Test-Driven Development (TDD)

**This project follows strict Test-Driven Development practices.**

#### Red-Green-Refactor Cycle

**MANDATORY: All code changes MUST follow the TDD cycle:**

1. **RED**: Write a failing test first
   - Test must fail for the right reason (feature doesn't exist yet)
   - Test should be minimal and focused on one behavior
   - Run test to confirm it fails

2. **GREEN**: Write minimal code to make the test pass
   - Only write code needed to pass the current test
   - Resist the urge to add extra features or abstractions
   - Run test to confirm it passes

3. **REFACTOR**: Improve code quality without changing behavior
   - Remove duplication
   - Improve naming and structure
   - Extract reusable functions/components
   - Run tests to ensure they still pass

**Process Enforcement:**

- NEVER write implementation code before writing a failing test
- NEVER commit code without corresponding tests
- NEVER skip the refactor step
- Tests must be run and verified at each step

#### Testing Strategy

**Unit Tests** (Primary focus):

- Test business logic in isolation
- Test utility functions (dependency-graph.ts, issue-helpers.ts)
- Test computed state logic (blocked, ready calculations)
- Test validation functions (story points, status transitions)
- Test database functions (cycle detection, triggers)

**Integration Tests**:

- Test SvelteKit server load functions
- Test form actions with database interactions
- Test RLS policies enforcement
- Test Supabase client operations

**Component Tests**:

- Test Svelte component behavior and interactions
- Test form validation and user input handling
- Test conditional rendering based on props/state
- Use Vitest + @testing-library/svelte

**E2E Tests** (Minimal - use sparingly):

- Test critical user flows only
- Example: Create project → Create issue → Add dependency
- Use Playwright for E2E testing

#### Test Organization

```
tests/
├── unit/
│   ├── utils/
│   │   ├── dependency-graph.test.ts
│   │   └── issue-helpers.test.ts
│   ├── stores/
│   │   └── computed.test.ts
│   └── validation/
│       └── story-points.test.ts
├── integration/
│   ├── server/
│   │   ├── load-functions.test.ts
│   │   └── form-actions.test.ts
│   └── database/
│       ├── rls-policies.test.ts
│       └── triggers.test.ts
├── component/
│   ├── IssueRow.test.ts
│   ├── IssueSheet.test.ts
│   └── DependencyGraph.test.ts
└── e2e/
    └── critical-flows.test.ts
```

#### Test Coverage Requirements

- **Minimum 80% code coverage** for business logic
- **100% coverage** for critical paths:
  - Dependency cycle detection
  - Data integrity rules
  - Status computation (blocked, ready)
  - RLS policies

#### Testing Tools

**Framework**: Vitest (fast, Vite-native)
**Component Testing**: @testing-library/svelte
**Mocking**: vi.mock() from Vitest
**E2E**: Playwright (minimal use)
**Database Testing**: Test against remote Supabase with test data cleanup

#### Example TDD Workflow

**Scenario: Add story point validation**

1. **RED - Write failing test**:

```typescript
// tests/unit/validation/story-points.test.ts
import { describe, it, expect } from 'vitest';
import { validateStoryPoints } from '$lib/utils/validation';

describe('validateStoryPoints', () => {
  it('should accept valid story point values', () => {
    expect(validateStoryPoints(1)).toBe(true);
    expect(validateStoryPoints(5)).toBe(true);
    expect(validateStoryPoints(null)).toBe(true);
  });

  it('should reject invalid story point values', () => {
    expect(validateStoryPoints(4)).toBe(false);
    expect(validateStoryPoints(10)).toBe(false);
    expect(validateStoryPoints(-1)).toBe(false);
  });
});
```

Run: `npm run test` → Test fails (function doesn't exist)

2. **GREEN - Implement minimal solution**:

```typescript
// src/lib/utils/validation.ts
const VALID_STORY_POINTS = [1, 2, 3, 5, 8, 13, 21];

export function validateStoryPoints(value: number | null): boolean {
  if (value === null) return true;
  return VALID_STORY_POINTS.includes(value);
}
```

Run: `npm run test` → Test passes

3. **REFACTOR - Improve if needed**:

```typescript
// src/lib/utils/validation.ts
const VALID_STORY_POINTS = new Set([1, 2, 3, 5, 8, 13, 21]);

export function validateStoryPoints(value: number | null): boolean {
  return value === null || VALID_STORY_POINTS.has(value);
}
```

Run: `npm run test` → Test still passes

#### TDD Anti-Patterns to Avoid

**DON'T:**

- Write implementation before tests
- Write tests after implementation is complete
- Skip tests for "simple" code
- Write tests that just call the implementation
- Mock everything (prefer real objects when possible)
- Write tests that test implementation details

**DO:**

- Test behavior, not implementation
- Write tests that describe requirements
- Use descriptive test names that explain intent
- Keep tests simple and focused
- Prefer integration tests over heavy mocking
- Run tests frequently (every few minutes)

#### Database Testing Strategy

**Challenge**: No local Supabase (remote-only development)

**Approach**:

1. Use a dedicated test database in Supabase (separate project or schema)
2. Set test environment variables in `.env.test.local`
3. Clean up test data after each test run
4. Use transactions and rollbacks where possible
5. Seed minimal test data before test suites

**Example**:

```typescript
// tests/setup.ts
import { createClient } from '@supabase/supabase-js';

export async function setupTestDatabase() {
  const supabase = createClient(process.env.TEST_SUPABASE_URL!, process.env.TEST_SUPABASE_KEY!);
  // Seed test data
  await supabase.from('projects').insert({ name: 'Test Project' });
}

export async function cleanupTestDatabase() {
  // Delete test data
}
```

#### When to Write Tests

**Always write tests FIRST for:**

- New features
- Bug fixes (write test that reproduces bug, then fix)
- Refactoring existing code
- Complex business logic
- Data validation rules
- Security-critical code (RLS, auth)

**Can skip tests for:**

- Prototyping / spike work (must add tests before committing)
- Pure UI styling changes (visual-only, no logic)
- Configuration files
- Build scripts

### Mobile-First

- Responsive UI optimized for phone usage
- Fast list rendering (target: ≤500 issues total)
- Bottom sheet / drawer for issue detail editing
- Simple, predictable navigation

### Single-User Focus

- No multi-user collaboration
- No permissions or roles
- No real-time sync requirements
- No notifications (MVP)

### Dependency Graph Management

- **Cycle detection**: Use PostgreSQL recursive CTE to detect cycles before adding dependencies
- **Implementation**: Create `check_dependency_cycle()` function in Supabase
- **Client-side**: Optionally use topological sort for visualization
- Display blocked/blocking relationships inline in issue detail

### View Requirements

**Home View** (default):

- Primary list showing "Ready" issues
- Segmented filters: Ready, Doing, Blocked, Done
- Each row: title, project/epic, priority, blocked indicator

**Project View**:

- Epics list with counts (Ready, Blocked, Doing)

**Epic View**:

- Flat issue list with filters (All, Todo, Doing, In Review, Blocked, Done, Canceled)
- Inline "Add issue" functionality

**Issue Detail**:

- Editable fields in bottom sheet/drawer
- Inline dependency display (Blocked by / Blocking)
- Collapsible sub-issues list

## Database Schema (Supabase/PostgreSQL)

### Tables

**projects**

```sql
id uuid PRIMARY KEY
user_id uuid REFERENCES auth.users NOT NULL
name text NOT NULL
created_at timestamptz DEFAULT now()
archived_at timestamptz
```

**epics**

```sql
id uuid PRIMARY KEY
project_id uuid REFERENCES projects NOT NULL
name text NOT NULL
status text CHECK (status IN ('active', 'done', 'canceled'))
is_default boolean DEFAULT false
sort_order integer
```

**milestones**

```sql
id uuid PRIMARY KEY
user_id uuid REFERENCES auth.users NOT NULL
name text NOT NULL
due_date date
```

**issues**

```sql
id uuid PRIMARY KEY
project_id uuid REFERENCES projects NOT NULL
epic_id uuid REFERENCES epics NOT NULL
parent_issue_id uuid REFERENCES issues
milestone_id uuid REFERENCES milestones
title text NOT NULL
status text CHECK (status IN ('todo', 'doing', 'in_review', 'done', 'canceled'))
priority integer CHECK (priority BETWEEN 0 AND 3)
story_points integer CHECK (story_points IN (1, 2, 3, 5, 8, 13, 21))
sort_order integer
created_at timestamptz DEFAULT now()
```

**dependencies**

```sql
issue_id uuid REFERENCES issues ON DELETE CASCADE
depends_on_issue_id uuid REFERENCES issues ON DELETE CASCADE
PRIMARY KEY (issue_id, depends_on_issue_id)
CHECK (issue_id != depends_on_issue_id)
```

### Critical Database Functions

**Cycle Detection Function**

```sql
-- Create function to check for dependency cycles
-- Called before INSERT on dependencies table
-- Returns true if adding dependency would create cycle
CREATE OR REPLACE FUNCTION check_dependency_cycle(
  new_issue_id uuid,
  new_depends_on_id uuid
) RETURNS boolean
```

**Auto-Create Unassigned Epic Trigger**

```sql
-- Trigger on projects INSERT
-- Automatically creates "Unassigned" epic with is_default = true
```

### Row Level Security (RLS)

All tables must have RLS enabled with policies:

```sql
-- Users can only access their own data
CREATE POLICY "Users access own data" ON projects
  FOR ALL USING (auth.uid() = user_id);
```

Apply similar policies to all tables, joining through project_id → user_id.

## SvelteKit Architecture

### Project Structure

```
src/
├── routes/
│   ├── +layout.svelte           # Root layout with auth check
│   ├── +layout.server.ts         # Load user session
│   ├── +page.svelte              # Home view (Ready issues)
│   ├── +page.server.ts           # Load ready/doing/blocked issues
│   ├── projects/
│   │   ├── [id]/
│   │   │   ├── +page.svelte      # Project detail view
│   │   │   └── +page.server.ts   # Load project + epics
│   ├── epics/
│   │   ├── [id]/
│   │   │   ├── +page.svelte      # Epic detail view
│   │   │   └── +page.server.ts   # Load issues in epic
│   └── auth/
│       ├── login/+page.svelte
│       └── signup/+page.svelte
├── lib/
│   ├── components/
│   │   ├── ui/                   # shadcn/svelte components
│   │   ├── IssueRow.svelte       # Issue list item
│   │   ├── IssueSheet.svelte     # Issue detail drawer
│   │   ├── DependencyGraph.svelte
│   │   └── ProjectCard.svelte
│   ├── stores/
│   │   ├── issues.ts             # Writable stores for issues
│   │   └── computed.ts           # Derived stores for Ready/Blocked
│   ├── supabase.ts               # Supabase client initialization
│   └── utils/
│       ├── dependency-graph.ts   # Cycle detection, topological sort
│       └── issue-helpers.ts      # Status checks, blocking logic
└── app.d.ts                      # TypeScript definitions
```

### Key Patterns

**Server-side Data Loading**

```typescript
// +page.server.ts
export const load = async ({ locals: { supabase } }) => {
  const { data: issues } = await supabase
    .from('issues')
    .select('*, epic:epics(*), project:projects(*)')
    .eq('status', 'todo');

  return { issues };
};
```

**Form Actions for Mutations**

```typescript
// +page.server.ts
export const actions = {
  createIssue: async ({ request, locals: { supabase } }) => {
    const data = await request.formData();
    // Validate, insert, redirect
  },
};
```

**Computed States with Stores**

```typescript
// lib/stores/computed.ts
import { derived } from 'svelte/store';

export const readyIssues = derived(issues, ($issues) =>
  $issues.filter((issue) => issue.status === 'todo' && !isBlocked(issue)),
);
```

**Bottom Sheet Component Usage**

```svelte
<script>
  import { Sheet, SheetContent } from '$lib/components/ui/sheet';
  let open = false;
</script>

<Sheet bind:open>
  <SheetContent>
    <!-- Issue detail form -->
  </SheetContent>
</Sheet>
```

### Authentication Flow

1. User signs in via Supabase Auth (email/password or magic link)
2. Session stored in cookie via `@supabase/ssr`
3. `+layout.server.ts` loads session into `locals`
4. Protected routes check `locals.session` and redirect if null
5. RLS policies enforce user_id checks on all queries

## Development Setup

### Prerequisites

```bash
# Install dependencies
npm install

# Set up Supabase
# 1. Create project at supabase.com
# 2. Copy .env.example to .env.local
# 3. Add SUPABASE_URL and SUPABASE_ANON_KEY
```

### Important: No Docker / Remote-Only Supabase

**This project does NOT use Docker or local Supabase development.**

- All database work is done directly against the remote Supabase instance
- Do NOT run `npx supabase start` or any local Supabase commands
- Database migrations are applied directly to remote using `npx supabase db push`
- Testing and development use the remote Supabase database

**Rationale**: Simpler setup, no Docker dependencies, and ensures development environment matches production.

### Commands

```bash
# Development server (localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run single test file
npm run test path/to/test.spec.ts

# Type checking
npm run check

# Lint
npm run lint

# Format code
npm run format

# Database migrations
npx supabase migration new <migration_name>
npx supabase db push  # Push to remote
```

## shadcn/svelte Components

Key components from shadcn/svelte to use:

**Layout & Navigation:**

- `Sheet` / `Drawer` - Bottom sheet for issue detail editing (mobile-first)
- `Tabs` - Segmented filters (Ready/Doing/Blocked/Done)
- `Command` - Command palette for quick navigation (⌘K)

**Forms & Inputs:**

- `Select` / `Combobox` - Epic and milestone selection
- `Input` - Issue title, story points
- `Textarea` - Issue description (if added later)
- `Button` - Primary actions
- `Form` - Form validation with SvelteKit actions

**Display:**

- `Badge` - Priority (P0-P3), blocked indicator, status
- `Card` - Project cards, epic cards
- `Separator` - Visual dividers
- `Collapsible` - Sub-issues list, dependency lists

**Feedback:**

- `Toast` - Success/error messages
- `Dialog` - Confirmation dialogs (delete, bulk actions)
- `Popover` - Context menus, quick actions

**Installation:**

```bash
npx shadcn-svelte@latest init
npx shadcn-svelte@latest add sheet tabs command select badge card
```

## Critical Implementation Notes

### Dependency Cycle Prevention

**PostgreSQL Implementation:**

```sql
-- Use recursive CTE to detect cycles
WITH RECURSIVE dependency_path AS (
  SELECT issue_id, depends_on_issue_id, ARRAY[issue_id] as path
  FROM dependencies
  WHERE issue_id = $new_issue_id

  UNION ALL

  SELECT d.issue_id, d.depends_on_issue_id, path || d.issue_id
  FROM dependencies d
  JOIN dependency_path dp ON d.issue_id = dp.depends_on_issue_id
  WHERE NOT (d.issue_id = ANY(path))  -- Prevent infinite recursion
)
SELECT EXISTS (
  SELECT 1 FROM dependency_path
  WHERE depends_on_issue_id = $new_depends_on_id
) AS would_create_cycle;
```

**Client-side validation:**

1. Call `check_dependency_cycle()` RPC before inserting dependency
2. Show error if cycle detected
3. Optionally visualize dependency path that would create cycle

### Story Point Validation

Story points must be validated at input layer:

- Only allow: 1, 2, 3, 5, 8, 13, 21, or null
- Reject any other values

### Status Transition Logic

When computing "Blocked" state:

- `done` and `canceled` dependencies do NOT block
- `todo`, `doing`, and `in_review` dependencies DO block
- This affects what appears in "Ready" view

### Epic Assignment

- Every issue creation/update must ensure epic is non-null
- When creating sub-issue, inherit parent's epic
- When moving issue to different project, reassign to valid epic in target project

## Out of Scope (MVP)

These features are explicitly NOT included:

- Multi-user support / collaboration
- Notifications
- Templates
- Reporting / velocity charts
- Time tracking
- Kanban boards
- Gantt charts
- Offline mode
