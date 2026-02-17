<script lang="ts">
  import type { Issue } from '$lib/types';

  export let issues: Issue[];
  export let title: string;
  export let milestoneDueDate: string | null = null;

  $: nonCanceled = issues.filter((i) => i.status !== 'canceled');
  $: doneCount = nonCanceled.filter((i) => i.status === 'done').length;
  $: totalCount = nonCanceled.length;
  $: completionPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  $: totalPoints = nonCanceled.reduce((sum, i) => sum + (i.story_points || 0), 0);
  $: donePoints = nonCanceled
    .filter((i) => i.status === 'done')
    .reduce((sum, i) => sum + (i.story_points || 0), 0);
</script>

<div class="space-y-2">
  <div class="flex items-baseline justify-between">
    <h2 class="font-accent text-sm font-medium">{title}</h2>
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
