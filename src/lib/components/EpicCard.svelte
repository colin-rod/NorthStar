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
   * - Clickable to navigate to epic detail
   */

  import type { Epic } from '$lib/types';
  import { computeProgress, type IssueCounts } from '$lib/utils/issue-counts';
  import { Card, CardHeader, CardContent } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';

  export let epic: Epic;
  export let counts: IssueCounts;

  // Status badge variant mapping
  const getStatusVariant = (status: string) => {
    if (status === 'active') return 'default';
    if (status === 'done') return 'status-done';
    return 'status-canceled';
  };
</script>

<!-- North Design: Card with 10px radius, subtle border, minimal hover -->
<a href="/epics/{epic.id}" class="block">
  <Card
    class="hover:shadow-level-1 transition-shadow duration-150 cursor-pointer border-border rounded-md"
  >
    <CardHeader class="pb-4">
      <div class="flex items-center justify-between gap-3">
        <!-- Epic name: section header weight -->
        <h3 class="text-section-header font-ui flex-1 min-w-0 truncate">{epic.name}</h3>
        <!-- Status badge: subtle, not loud -->
        <Badge variant={getStatusVariant(epic.status)} class="text-xs shrink-0">
          {epic.status}
        </Badge>
      </div>
    </CardHeader>
    <CardContent>
      <!-- Counts with subtle badges in 3x2 grid -->
      <div class="grid grid-cols-3 gap-3 text-metadata">
        <!-- Row 1: Active work states -->
        <div class="flex items-center gap-2">
          <Badge variant="default" class="text-xs">{counts.ready}</Badge>
          <span class="text-foreground-secondary">Ready</span>
        </div>
        <div class="flex items-center gap-2">
          <Badge variant="status-doing" class="text-xs">{counts.doing}</Badge>
          <span class="text-foreground-secondary">Doing</span>
        </div>
        <div class="flex items-center gap-2">
          <Badge variant="status-in-review" class="text-xs">{counts.inReview}</Badge>
          <span class="text-foreground-secondary">In Review</span>
        </div>

        <!-- Row 2: Problem/terminal states -->
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
      <!-- Progress bar -->
      {@const progress = computeProgress(counts)}
      {#if progress.total > 0}
        <div class="mt-3 flex items-center gap-2">
          <div class="flex-1 h-[3px] bg-muted rounded-full overflow-hidden">
            <div
              class="h-full bg-foreground/40 rounded-full transition-all duration-300"
              style="width: {progress.percentage}%"
            ></div>
          </div>
          <span class="text-metadata text-foreground-secondary shrink-0">
            {progress.percentage}%
          </span>
        </div>
      {/if}
    </CardContent>
  </Card>
</a>
