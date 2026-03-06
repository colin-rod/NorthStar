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
  import { Home, Folder, Search, User } from '@lucide/svelte';

  import { page } from '$app/stores';
  import { cn } from '$lib/utils';
  import { navSearchOpen } from '$lib/stores/issues';

  // Derive active states from current pathname
  const pathname = $derived($page.url.pathname);
  const isHome = $derived(pathname === '/');
  const isProjects = $derived(pathname.startsWith('/projects'));
  const isSettings = $derived(pathname.startsWith('/settings'));
</script>

<!-- North Design: Minimal mobile nav with burnt orange active state -->
<nav
  aria-label="Mobile navigation"
  class="fixed bottom-0 inset-x-0 z-40 border-t border-border-divider bg-surface md:hidden"
>
  <div class="flex justify-around items-center h-16">
    <a
      href="/"
      aria-label="Home"
      aria-current={isHome ? 'page' : undefined}
      class={cn(
        'flex flex-col items-center justify-center gap-1 flex-1 self-stretch transition-colors',
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
        'flex flex-col items-center justify-center gap-1 flex-1 self-stretch transition-colors',
        isProjects ? 'text-primary' : 'text-foreground-muted hover:text-foreground-secondary',
      )}
    >
      <Folder class="w-6 h-6" />
      <span class="text-xs font-medium">Projects</span>
    </a>

    <button
      onclick={() => navSearchOpen.set(true)}
      aria-label="Search"
      class={cn(
        'flex flex-col items-center justify-center gap-1 flex-1 self-stretch transition-colors',
        $navSearchOpen ? 'text-primary' : 'text-foreground-muted hover:text-foreground-secondary',
      )}
    >
      <Search class="w-6 h-6" />
      <span class="text-xs font-medium">Search</span>
    </button>

    <a
      href="/settings"
      aria-label="Account"
      aria-current={isSettings ? 'page' : undefined}
      class={cn(
        'flex flex-col items-center justify-center gap-1 flex-1 self-stretch transition-colors',
        isSettings ? 'text-primary' : 'text-foreground-muted hover:text-foreground-secondary',
      )}
    >
      <User class="w-6 h-6" />
      <span class="text-xs font-medium">Account</span>
    </a>
  </div>
</nav>
