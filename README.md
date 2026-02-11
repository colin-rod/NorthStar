# NorthStar

A single-user project management application designed to manage multiple personal projects without team collaboration overhead. Built with SvelteKit, Supabase, and Tailwind CSS.

## Features

- **Hierarchical Work Breakdown**: Projects → Epics → Issues → Sub-issues
- **Dependency Tracking**: Explicit dependencies with blocking states and cycle prevention
- **Mobile-First UI**: Optimized for fast, responsive mobile usage
- **Story Points & Milestones**: Track effort and organize work into phases
- **Priority Management**: Clear prioritization with P0-P3 levels

## Tech Stack

- **Frontend**: SvelteKit - Fast, lightweight framework with minimal JavaScript
- **Styling**: Tailwind CSS + shadcn/svelte components
- **Database**: Supabase (PostgreSQL with built-in Auth)
- **Package Manager**: pnpm
- **Deployment**: Vercel

## Prerequisites

- Node.js 20+
- pnpm 9+

Install pnpm if you haven't already:

```bash
npm install -g pnpm
```

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase project credentials:

1. Go to [supabase.com](https://supabase.com/dashboard)
2. Create a new project (or use existing)
3. Go to Project Settings → API
4. Copy the Project URL and anon/public key
5. Update `.env.local`:

```bash
PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Verify Supabase Connection

Test that your Supabase connection is working:

```bash
pnpm dev
```

Navigate to [http://localhost:5173/test](http://localhost:5173/test)

You should see:

- ✅ Server-side timestamp (proving server connection works)
- ✅ Client-side timestamp (proving browser connection works)

If you see errors:

- Check that `.env.local` exists with correct `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY`
- Verify credentials in Supabase dashboard (Project Settings → API)
- Ensure Supabase project is not paused

### 4. Start Development

Once the connection test passes, you're ready to develop:

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Development Commands

```bash
# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui

# Type checking
pnpm run check

# Type checking in watch mode
pnpm run check:watch

# Lint code
pnpm lint

# Format code
pnpm format
```

## Project Structure

```
src/
├── lib/
│   ├── supabase.ts          # Client-side Supabase client
│   ├── supabase.server.ts   # Server-side Supabase helper
│   ├── components/          # Svelte components
│   ├── stores/              # Svelte stores
│   ├── utils/               # Utility functions
│   └── assets/              # Static assets
├── routes/                  # SvelteKit routes (pages)
│   ├── test/                # Supabase connection test page
│   │   ├── +page.server.ts
│   │   └── +page.svelte
│   ├── +layout.svelte       # Root layout
│   └── +page.svelte         # Home page
├── hooks.server.ts          # SvelteKit server hooks (auth state)
└── app.css                  # Global styles (Tailwind)
```

## CI/CD

GitHub Actions runs automatically on:

- Push to `main` branch
- Pull requests

CI pipeline includes:

- Type checking
- Linting
- Tests
- Build verification

## Documentation

For more detailed information about the architecture and implementation, see [CLAUDE.md](CLAUDE.md).

## License

Private project - not licensed for public use.
