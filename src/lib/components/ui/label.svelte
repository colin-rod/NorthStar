<script lang="ts">
  import { cn } from '$lib/utils';
  import type { Snippet } from 'svelte';
  import type { HTMLLabelAttributes } from 'svelte/elements';

  let {
    class: className,
    children,
    ...props
  }: { class?: string; children?: Snippet } & HTMLLabelAttributes = $props();
</script>

<label
  class={cn(
    'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
    className,
  )}
  {...props}
>
  {#if children}
    {@render children()}
  {/if}
</label>
