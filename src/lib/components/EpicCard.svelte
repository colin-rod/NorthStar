<script lang="ts">
  /**
   * EpicCard Component - North Design System
   *
   * Displays an epic card with issue counts.
   * Used in: Project detail view
   *
   * North Design Principles:
   * - 10px border radius for cards
   * - Subtle border, no heavy shadows
   * - Minimal hover states
   * - Clean typography hierarchy
   *
   * Requirements from CLAUDE.md:
   * - Show epic name and status
   * - Show 6 issue counts: Ready, Blocked, Doing, In Review, Done, Canceled
   * - Clickable to expand inline (drill-down) or navigate to epic detail
   */

  import type { Epic } from '$lib/types';
  import { computeProgress, type IssueCounts } from '$lib/utils/issue-counts';
  import { Card, CardHeader, CardContent } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import PriorityBadge from '$lib/components/PriorityBadge.svelte';
  import IssueCountsBadges from '$lib/components/IssueCountsBadges.svelte';
  import ProgressBar from '$lib/components/ProgressBar.svelte';

  interface Props {
    epic: Epic;
    counts: IssueCounts;
    isExpanded?: boolean;
    onToggle?: () => void;
  }

  let { epic, counts, isExpanded = false, onToggle }: Props = $props();

  // Status badge variant mapping
  const getStatusVariant = (status: string) => {
    if (status === 'active') return 'default';
    if (status === 'backlog') return 'default';
    if (status === 'on_hold') return 'status-in-review';
    if (status === 'completed') return 'status-done';
    if (status === 'canceled') return 'status-canceled';
    return 'default';
  };

  let headerProgress = $derived(computeProgress(counts));
</script>

{#snippet cardBody()}
  <CardHeader class="pb-4">
    <div class="flex items-center justify-between gap-3">
      <!-- Epic name: section header weight -->
      <h3 class="text-section-header font-accent flex-1 min-w-0 truncate">{epic.name}</h3>
      <!-- Summary pill, priority, milestone, and status badge -->
      <div class="flex items-center gap-2 shrink-0">
        {#if headerProgress.total > 0}
          <Badge variant="outline" class="text-xs"
            >{headerProgress.completed}/{headerProgress.total}</Badge
          >
        {/if}
        {#if epic.priority !== null && epic.priority !== undefined}
          <PriorityBadge priority={epic.priority} />
        {/if}
        {#if epic.milestone}
          <Badge variant="outline" class="text-xs text-foreground-secondary">
            {epic.milestone.name}
          </Badge>
        {/if}
        <Badge variant={getStatusVariant(epic.status)} class="text-xs">
          {epic.status}
        </Badge>
      </div>
    </div>
  </CardHeader>
  <CardContent>
    <!-- Counts with subtle badges in 3x2 grid -->
    <IssueCountsBadges {counts} />
    <!-- Progress bar -->
    {#if headerProgress.total > 0}
      <div class="mt-3">
        <ProgressBar percentage={headerProgress.percentage} ariaLabel="Epic completion progress" />
      </div>
    {/if}
  </CardContent>
{/snippet}

<!-- North Design: Card with 10px radius, subtle border, minimal hover -->
{#if onToggle}
  <!-- Drill-down mode: clickable button to expand inline -->
  <button type="button" onclick={onToggle} class="block w-full text-left">
    <Card
      class="hover:shadow-level-1 transition-shadow duration-150 cursor-pointer border-border rounded-md"
    >
      {@render cardBody()}
    </Card>
  </button>
{:else}
  <!-- Navigation mode: link to epic detail page -->
  <a href="/epics/{epic.id}" class="block">
    <Card
      class="hover:shadow-level-1 transition-shadow duration-150 cursor-pointer border-border rounded-md"
    >
      {@render cardBody()}
    </Card>
  </a>
{/if}
