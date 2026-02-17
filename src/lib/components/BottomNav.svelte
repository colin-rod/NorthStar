<script lang="ts">
  /**
   * BottomNav Component - North Design System (Mobile)
   *
   * North Design Principles:
   * - Burnt orange accent for active nav items
   * - Muted text for inactive items
   * - Minimal, clean appearance
   * - Mobile-first touch targets
   */
  import { Home, Folder, Search } from '@lucide/svelte';

  import { page } from '$app/stores';
  import { cn } from '$lib/utils';

  // Derive active states from current pathname
  $: pathname = $page.url.pathname;
  $: isHome = pathname === '/';
  $: isProjects = pathname.startsWith('/projects');
  $: isSearch = pathname === '/search';
</script>

<!-- North Design: Minimal mobile nav with burnt orange active state -->
<nav class="fixed bottom-0 inset-x-0 z-40 border-t border-border-divider bg-surface md:hidden">
  <div class="flex justify-around items-center h-16">
    <a
      href="/"
      aria-label="Home"
      aria-current={isHome ? 'page' : undefined}
      class={cn(
        'flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors',
        isHome ? 'text-primary' : 'text-foreground-muted hover:text-foreground-secondary',
      )}
    >
      <Home class="w-6 h-6" />
      <span class="text-xs font-medium">Home</span>
    </a>

    <a
      href="/projects"
      aria-label="Projects"
      aria-current={isProjects ? 'page' : undefined}
      class={cn(
        'flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors',
        isProjects ? 'text-primary' : 'text-foreground-muted hover:text-foreground-secondary',
      )}
    >
      <Folder class="w-6 h-6" />
      <span class="text-xs font-medium">Projects</span>
    </a>

    <a
      href="/search"
      aria-label="Search"
      aria-current={isSearch ? 'page' : undefined}
      class={cn(
        'flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors',
        isSearch ? 'text-primary' : 'text-foreground-muted hover:text-foreground-secondary',
      )}
    >
      <Search class="w-6 h-6" />
      <span class="text-xs font-medium">Search</span>
    </a>
  </div>
</nav>
