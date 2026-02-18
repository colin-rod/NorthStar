<script lang="ts">
  /**
   * Header Component - North Design System
   *
   * North Design Principles:
   * - Clean, minimal chrome
   * - Use serif font (Fraunces) for "North" wordmark
   * - Burnt orange accent for active states
   * - Subtle borders
   */
  import { enhance } from '$app/forms';
  import { ChevronDown, Settings, LogOut } from '@lucide/svelte';
  import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
  import Breadcrumbs, { type BreadcrumbItem } from '$lib/components/Breadcrumbs.svelte';
  import NavSearch from '$lib/components/NavSearch.svelte';
  import type { Session } from '@supabase/supabase-js';

  let { session, breadcrumbs = [] }: { session: Session | null; breadcrumbs?: BreadcrumbItem[] } =
    $props();

  let loggingOut = $state(false);
  let menuOpen = $state(false);
</script>

<!-- North Design: Minimal header with subtle border -->
<header class="border-b border-border-divider bg-surface">
  <div class="container mx-auto flex items-center justify-between px-4 py-4">
    <div class="flex items-center gap-4">
      <!-- North wordmark with serif font per design spec -->
      <a
        href="/"
        class="font-accent text-page-title text-foreground hover:text-primary transition-colors md:hidden"
      >
        North
      </a>

      <!-- Breadcrumbs (desktop only) -->
      {#if breadcrumbs.length > 0}
        <div class="hidden md:block">
          <Breadcrumbs items={breadcrumbs} />
        </div>
      {/if}
    </div>

    {#if session}
      <div class="flex items-center gap-4">
        <NavSearch />

        <!-- User menu dropdown -->
        <Popover bind:open={menuOpen}>
          <PopoverTrigger
            class="hidden sm:inline-flex items-center gap-1 text-metadata text-foreground-muted hover:text-foreground transition-colors"
          >
            {session.user.email}
            <ChevronDown class="w-3 h-3" />
          </PopoverTrigger>
          <PopoverContent align="end" class="w-44 p-1">
            <a
              href="/settings"
              onclick={() => (menuOpen = false)}
              class="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-sm hover:bg-surface-subtle transition-colors text-foreground"
            >
              <Settings class="w-4 h-4" />
              Settings
            </a>
            <div class="my-1 border-t border-border-divider"></div>
            <form
              method="POST"
              action="/?/logout"
              use:enhance={() => {
                loggingOut = true;
                menuOpen = false;
                return async ({ update }) => {
                  await update();
                  loggingOut = false;
                };
              }}
            >
              <button
                type="submit"
                disabled={loggingOut}
                class="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-sm hover:bg-surface-subtle transition-colors text-foreground disabled:opacity-50"
              >
                <LogOut class="w-4 h-4" />
                {loggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </form>
          </PopoverContent>
        </Popover>
      </div>
    {/if}
  </div>
</header>
