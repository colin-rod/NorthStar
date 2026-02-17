<script lang="ts">
  import { cn } from '$lib/utils';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    class: className,
    children,
    ...props
  }: { class?: string; children?: Snippet } & HTMLAttributes<HTMLDivElement> = $props();
</script>

<!-- North Design: Segmented control with underline indicator, no background fills -->
<div
  class={cn(
    'inline-flex items-center justify-start gap-4 border-b border-border-divider',
    className,
  )}
  {...props}
>
  {#if children}
    {@render children()}
  {/if}
</div>
