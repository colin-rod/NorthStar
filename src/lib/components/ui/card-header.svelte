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

<div class={cn('flex flex-col space-y-1.5 p-6', className)} {...props}>
  {#if children}
    {@render children()}
  {/if}
</div>
