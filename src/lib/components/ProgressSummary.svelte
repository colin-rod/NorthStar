<script lang="ts">
  import type { Issue } from '$lib/types';
  import { isBlocked } from '$lib/utils/issue-helpers';
  import Badge from '$lib/components/ui/badge/badge.svelte';
  import Lock from '@lucide/svelte/icons/lock';

  interface Props {
    issues: Issue[];
    title: string;
    milestoneDueDate?: string | null;
  }
  let { issues, title, milestoneDueDate = null }: Props = $props();

  let nonCanceled = $derived(issues.filter((i) => i.status !== 'canceled'));
  let blockedCount = $derived(nonCanceled.filter((i) => isBlocked(i)).length);
  let doneCount = $derived(nonCanceled.filter((i) => i.status === 'done').length);
  let totalCount = $derived(nonCanceled.length);
  let completionPercent = $derived(totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0);
  let clampedCompletionPercent = $derived(
    Math.max(0, Math.min(100, Number(completionPercent) || 0)),
  );
  let fillClass = $derived(
    clampedCompletionPercent === 100
      ? 'bg-green-500'
      : clampedCompletionPercent >= 75
        ? 'bg-emerald-500'
        : clampedCompletionPercent >= 50
          ? 'bg-blue-500'
          : clampedCompletionPercent >= 25
            ? 'bg-amber-500'
            : 'bg-red-500',
  );

  let totalPoints = $derived(nonCanceled.reduce((sum, i) => sum + (i.story_points || 0), 0));
  let donePoints = $derived(
    nonCanceled
      .filter((i) => i.status === 'done')
      .reduce((sum, i) => sum + (i.story_points || 0), 0),
  );
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

  <div
    class="h-2 w-full rounded-full bg-muted"
    role="progressbar"
    aria-valuemin="0"
    aria-valuemax="100"
    aria-valuenow={clampedCompletionPercent}
    aria-label="Completion progress"
  >
    <div
      class="h-2 rounded-full {fillClass} transition-all duration-300"
      style="width: {completionPercent}%"
    ></div>
  </div>

  <div class="flex gap-4 text-xs text-muted-foreground">
    <span>{doneCount} / {totalCount} issues complete</span>
    {#if totalPoints > 0}
      <span>{donePoints} / {totalPoints} story points done</span>
    {/if}
  </div>
  {#if blockedCount > 0}
    <p class="text-xs text-muted-foreground">
      {blockedCount}
      {blockedCount === 1 ? 'issue is' : 'issues are'} waiting on dependencies
    </p>
  {/if}
</div>
