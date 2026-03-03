<script lang="ts">
  import type { IssueCounts } from '$lib/utils/issue-counts';
  import Badge from '$lib/components/ui/badge/badge.svelte';

  interface Props {
    counts: IssueCounts;
  }

  let { counts }: Props = $props();
</script>

<div class="grid grid-cols-3 gap-3 text-metadata">
  <div class="flex items-center gap-2">
    <Badge variant="default" class="text-xs">{counts.ready}</Badge>
    <span class="text-foreground-secondary">Ready</span>
  </div>
  <div class="flex items-center gap-2">
    <Badge variant="status-doing" class="text-xs">{counts.in_progress}</Badge>
    <span class="text-foreground-secondary">In Progress</span>
  </div>
  <div class="flex items-center gap-2">
    <Badge variant="status-in-review" class="text-xs">{counts.inReview}</Badge>
    <span class="text-foreground-secondary">In Review</span>
  </div>
  <div class="flex items-center gap-2">
    <Badge variant="status-blocked" class="text-xs">{counts.blocked}</Badge>
    <span class="text-foreground-secondary">Blocked</span>
  </div>
  <div class="flex items-center gap-2">
    <Badge variant="status-done" class="text-xs">{counts.done}</Badge>
    <span class="text-foreground-secondary">Done</span>
  </div>
  <div class="flex items-center gap-2">
    <Badge variant="status-canceled" class="text-xs">{counts.canceled}</Badge>
    <span class="text-foreground-secondary">Canceled</span>
  </div>
</div>
