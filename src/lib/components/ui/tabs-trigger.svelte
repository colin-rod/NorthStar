<script lang="ts">
  import { cn } from '$lib/utils';
  import { getContext } from 'svelte';
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  let {
    class: className,
    value,
    children,
    ...props
  }: { class?: string; value: string; children?: Snippet } & HTMLButtonAttributes = $props();

  const ctx = getContext<{ activeTab: () => string; setTab: (tab: string) => void }>('tabs');
  const isActive = $derived(ctx.activeTab() === value);
</script>

<!-- North Design: Underline indicator in burnt orange, text muted by default, primary when active -->
<button
  type="button"
  class={cn(
    'relative inline-flex items-center justify-center whitespace-nowrap px-0 pb-3 text-[15px] font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    /* Text color: muted by default, primary when active */
    isActive ? 'text-foreground' : 'text-foreground-muted hover:text-foreground-secondary',
    /* Underline indicator via border-bottom */
    isActive && 'border-b-2 border-primary',
    className,
  )}
  onclick={() => ctx.setTab(value)}
  {...props}
>
  {#if children}
    {@render children()}
  {/if}
</button>
