# Project Structure

This document explains the organization of the IssueTracker codebase.

## Directory Overview

```
IssueTracker/
├── src/                          # Source code
│   ├── lib/                      # Library code
│   │   ├── components/           # Svelte components
│   │   │   ├── ui/               # shadcn/svelte UI components
│   │   │   ├── Header.svelte
│   │   │   ├── IssueRow.svelte   # Issue list item component
│   │   │   ├── IssueSheet.svelte # Issue detail drawer
│   │   │   ├── ProjectCard.svelte
│   │   │   ├── EpicCard.svelte
│   │   │   └── DependencyGraph.svelte
│   │   │
│   │   ├── stores/               # Svelte stores
│   │   │   ├── issues.ts         # Issue state management
│   │   │   └── computed.ts       # Derived stores (Ready, Blocked, etc.)
│   │   │
│   │   ├── types/                # TypeScript types
│   │   │   └── index.ts          # All entity types
│   │   │
│   │   ├── utils/                # Utility functions
│   │   │   ├── issue-helpers.ts  # isBlocked(), isReady(), etc.
│   │   │   └── dependency-graph.ts # Cycle detection, topological sort
│   │   │
│   │   ├── supabase.ts           # Supabase client (browser)
│   │   ├── supabase.server.ts    # Supabase client (server)
│   │   └── utils.ts              # Generic utilities
│   │
│   ├── routes/                   # SvelteKit routes
│   │   ├── (protected)/          # Authenticated routes
│   │   │   ├── +layout.svelte    # Protected layout
│   │   │   ├── +layout.server.ts # Auth check
│   │   │   ├── +page.svelte      # Home view (Ready issues)
│   │   │   ├── +page.server.ts   # Load issues
│   │   │   │
│   │   │   ├── projects/[id]/    # Project detail
│   │   │   ├── epics/[id]/       # Epic detail
│   │   │   └── issues/[id]/      # Issue detail (optional)
│   │   │
│   │   └── (public)/             # Public routes
│   │       └── auth/
│   │           ├── login/        # Login page
│   │           ├── signup/       # Signup page
│   │           └── confirm/      # Email confirmation
│   │
│   ├── app.d.ts                  # TypeScript ambient types
│   └── app.css                   # Global styles
│
├── supabase/                     # Supabase configuration
│   ├── config.toml               # Local dev config
│   └── migrations/               # Database migrations
│       └── 001_initial_schema.sql
│
├── tests/                        # E2E tests
│   └── example.spec.ts
│
└── [config files]                # Various config files

```

## Key Architecture Decisions

### Component Organization

**Domain Components** (`lib/components/`)

- `IssueRow.svelte` - Reusable issue list item
- `IssueSheet.svelte` - Bottom sheet for editing issues
- `ProjectCard.svelte` - Project overview card
- `EpicCard.svelte` - Epic overview card
- `DependencyGraph.svelte` - Dependency visualization

**UI Components** (`lib/components/ui/`)

- shadcn/svelte components (Button, Input, Card, etc.)
- Generic, reusable UI primitives

### State Management

**Stores** (`lib/stores/`)

- `issues.ts` - Writable stores for issues, projects, epics
- `computed.ts` - Derived stores for Ready/Blocked/Doing filters

### Business Logic

**Utilities** (`lib/utils/`)

- `issue-helpers.ts` - Status computations (isBlocked, isReady)
- `dependency-graph.ts` - Cycle detection, topological sort

### Route Structure

**Protected Routes** (`routes/(protected)/`)

- Require authentication
- Main application functionality
- Home, Projects, Epics, Issues

**Public Routes** (`routes/(public)/`)

- No authentication required
- Login, Signup, Confirmation

### Database

**Schema** (`supabase/migrations/001_initial_schema.sql`)

- Complete schema with all tables, indexes, functions, triggers
- RLS policies for security
- Cycle detection for dependencies
- Auto-creation of default "Unassigned" epic

## Next Steps

1. **Set up Supabase**

   ```bash
   npx supabase init
   npx supabase start
   npx supabase db reset  # Apply migrations
   ```

2. **Configure environment**
   - Copy `.env.example` to `.env.local`
   - Add your Supabase URL and anon key

3. **Install dependencies**

   ```bash
   pnpm install
   ```

4. **Run development server**

   ```bash
   pnpm dev
   ```

5. **Implement TODO items**
   - Each file has TODO comments marking what needs implementation
   - Start with completing component logic
   - Then implement form actions
   - Finally, add tests

## File Naming Conventions

- **Components**: PascalCase (e.g., `IssueRow.svelte`)
- **Utilities**: kebab-case (e.g., `issue-helpers.ts`)
- **Types**: kebab-case (e.g., `index.ts` in `types/`)
- **Routes**: SvelteKit conventions (`+page.svelte`, `+page.server.ts`)

## Import Patterns

```typescript
// Types
import type { Issue, Project } from '$lib/types';

// Components
import IssueRow from '$lib/components/IssueRow.svelte';

// Stores
import { issues, openIssueSheet } from '$lib/stores/issues';
import { readyIssues } from '$lib/stores/computed';

// Utils
import { isBlocked, isReady } from '$lib/utils/issue-helpers';
import { wouldCreateCycle } from '$lib/utils/dependency-graph';

// Supabase
import { supabase } from '$lib/supabase';
```

## Testing

**Unit Tests**: Test utility functions

```bash
pnpm test
```

**E2E Tests**: Test full user flows

```bash
pnpm test:e2e
```

## Documentation

- **CLAUDE.md**: Project overview and requirements
- **README.md**: Getting started guide
- **This file**: Project structure explanation
