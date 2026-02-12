<script lang="ts">
  /**
   * Protected Layout
   *
   * Wraps all authenticated pages.
   * Shows navigation, checks auth status.
   */

  import BottomNav from '$lib/components/BottomNav.svelte';
  import Header from '$lib/components/Header.svelte';
  import SideNav from '$lib/components/SideNav.svelte';
  import type { BreadcrumbItem } from '$lib/components/Breadcrumbs.svelte';

  const { children, data } = $props();

  // Extract breadcrumbs from page data if available
  let breadcrumbs = $derived<BreadcrumbItem[]>((data as any).breadcrumbs || []);
</script>

<div class="min-h-screen flex">
  <!-- Desktop: Left sidebar -->
  <SideNav />

  <!-- Main content area -->
  <div class="flex-1 flex flex-col pb-16 md:pb-0 md:ml-64">
    <Header session={data.session} {breadcrumbs} />
    <main class="flex-1 container mx-auto px-4 py-6 max-w-6xl">
      {@render children()}
    </main>
  </div>

  <!-- Mobile: Bottom navigation -->
  <BottomNav />
</div>
