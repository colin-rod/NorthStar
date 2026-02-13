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
  import { Button } from '$lib/components/ui/button';
  import Breadcrumbs, { type BreadcrumbItem } from '$lib/components/Breadcrumbs.svelte';
  import type { Session } from '@supabase/supabase-js';

  let { session, breadcrumbs = [] }: { session: Session | null; breadcrumbs?: BreadcrumbItem[] } =
    $props();

  let loggingOut = $state(false);
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
        <!-- Email (hidden on mobile) -->
        <span class="text-metadata hidden sm:inline">
          {session.user.email}
        </span>

        <!-- Logout button with North microcopy -->
        <form
          method="POST"
          action="/?/logout"
          use:enhance={() => {
            loggingOut = true;
            return async ({ update }) => {
              await update();
              loggingOut = false;
            };
          }}
        >
          <Button type="submit" variant="secondary" size="sm" disabled={loggingOut}>
            {loggingOut ? 'Logging out...' : 'Logout'}
          </Button>
        </form>
      </div>
    {/if}
  </div>
</header>
