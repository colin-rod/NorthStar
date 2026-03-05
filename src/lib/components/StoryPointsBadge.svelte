<script lang="ts">
  import Badge from '$lib/components/ui/badge/badge.svelte';
  import type { BadgeVariant } from '$lib/components/ui/badge/badge.svelte';

  interface Props {
    story_points: number;
    class?: string;
  }

  let { story_points, class: className = '' }: Props = $props();

  const variantMap: Record<number, BadgeVariant> = {
    1: 'sp-1',
    2: 'sp-2',
    3: 'sp-3',
    5: 'sp-5',
    8: 'sp-8',
    13: 'sp-13',
    21: 'sp-21',
  };

  let variant = $derived(variantMap[story_points] ?? 'secondary');
</script>

<Badge {variant} class="text-xs tabular-nums {className}">
  {story_points} pts
</Badge>
