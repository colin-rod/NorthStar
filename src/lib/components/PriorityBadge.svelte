<script lang="ts">
  import Badge from '$lib/components/ui/badge/badge.svelte';
  import type { BadgeVariant } from '$lib/components/ui/badge/badge.svelte';
  import Flame from '@lucide/svelte/icons/flame';

  interface Props {
    priority: number;
    class?: string;
  }

  let { priority, class: className = '' }: Props = $props();

  const variantMap: Record<number, BadgeVariant> = {
    0: 'priority-p0',
    1: 'priority-p1',
    2: 'priority-p2',
    3: 'priority-p3',
  };

  let variant = $derived(variantMap[priority] ?? 'priority-p3');
</script>

<Badge {variant} class="text-xs {className}">
  {#if priority === 0}
    <Flame aria-hidden="true" class="h-3 w-3" />
  {/if}
  P{priority}
</Badge>
