<!-- src/lib/components/ActiveFilterChips.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import {
    getFilterChips,
    type FilterChip,
    type TreeFilterParams,
  } from '$lib/utils/tree-filter-params';
  import X from '@lucide/svelte/icons/x';

  interface Props {
    filterParams: TreeFilterParams;
  }

  let { filterParams }: Props = $props();

  let chips = $derived(getFilterChips(filterParams));

  function removeChip(chip: FilterChip) {
    const params = new URLSearchParams($page.url.searchParams);
    const current = params.get(chip.param);
    if (!current) return;

    const remaining = current
      .split(',')
      .filter((v) => v !== chip.value)
      .join(',');

    if (remaining) {
      params.set(chip.param, remaining);
    } else {
      params.delete(chip.param);
    }

    goto(`${$page.url.pathname}?${params.toString()}`, { replaceState: false, noScroll: true });
  }

  function clearAll() {
    const params = new URLSearchParams($page.url.searchParams);
    params.delete('project_status');
    params.delete('epic_status');
    params.delete('priority');
    params.delete('status');
    params.delete('story_points');
    const query = params.toString();
    goto(`${$page.url.pathname}${query ? `?${query}` : ''}`, {
      replaceState: false,
      noScroll: true,
    });
  }
</script>

{#if chips.length > 0}
  <div class="flex flex-wrap items-center gap-1.5">
    {#each chips as chip (chip.param + ':' + chip.value)}
      <span
        class="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground"
      >
        {chip.label}
        <button
          onclick={() => removeChip(chip)}
          class="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 focus:outline-none"
          aria-label="Remove filter: {chip.label}"
        >
          <X class="h-3 w-3" />
        </button>
      </span>
    {/each}
    <button
      onclick={clearAll}
      class="text-xs text-muted-foreground underline-offset-2 hover:underline ml-1"
    >
      Clear all
    </button>
  </div>
{/if}
