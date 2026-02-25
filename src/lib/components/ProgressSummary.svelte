<script lang="ts">
  import type { Issue } from '$lib/types';
  import { isBlocked } from '$lib/utils/issue-helpers';
  import Badge from '$lib/components/ui/badge/badge.svelte';
  import Lock from '@lucide/svelte/icons/lock';

  export let issues: Issue[];
  export let title: string;
  export let milestoneDueDate: string | null = null;

  $: nonCanceled = issues.filter((i) => i.status !== 'canceled');
  $: blockedCount = nonCanceled.filter((i) => isBlocked(i)).length;
  $: doneCount = nonCanceled.filter((i) => i.status === 'done').length;
  $: totalCount = nonCanceled.length;
  $: completionPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  $: totalPoints = nonCanceled.reduce((sum, i) => sum + (i.story_points || 0), 0);
  $: donePoints = nonCanceled
    .filter((i) => i.status === 'done')
    .reduce((sum, i) => sum + (i.story_points || 0), 0);
</script>

<div class="space-y-2">
  <div class="flex items-center justify-between">
    <h2 class="font-accent text-sm font-medium">{title}</h2>
    <div class="flex items-center gap-2">
      {#if blockedCount > 0}
        <Badge variant="status-blocked-strong" class="text-xs">
          <Lock class="h-3 w-3" />
          {blockedCount} Blocked
        </Badge>
      {/if}
      {#if milestoneDueDate}
        <span class="text-xs text-muted-foreground">
          Due {new Date(milestoneDueDate + 'T00:00:00').toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      {/if}
    </div>
  </div>

  <div class="h-2 w-full rounded-full bg-muted">
    <div
      class="h-2 rounded-full bg-primary transition-all duration-300"
      style="width: {completionPercent}%"
    ></div>
  </div>

  <div class="flex gap-4 text-xs text-muted-foreground">
    <span>{doneCount} / {totalCount} issues complete</span>
    {#if totalPoints > 0}
      <span>{donePoints} / {totalPoints} story points done</span>
    {/if}
  </div>
</div>
