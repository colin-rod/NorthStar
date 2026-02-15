<script lang="ts">
  /**
   * EpicRow Component - North Design System
   *
   * Displays a single epic in a row/list format with drill-down capability.
   * Used in: EpicTable (projects view inline expansion)
   *
   * North Design Principles:
   * - List-first, no heavy cards
   * - Light divider lines, slight hover tint
   * - 16px vertical padding
   * - Epic name: 16px, weight 500 (medium bold-ish)
   * - Metadata: 13px, secondary color
   */

  import type { Epic } from '$lib/types';
  import type { IssueCounts } from '$lib/utils/issue-counts';
  import { computeProgress } from '$lib/utils/issue-counts';
  import Badge from '$lib/components/ui/badge/badge.svelte';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';

  interface Props {
    epic: Epic;
    counts: IssueCounts;
    isExpanded?: boolean;
    onToggle: () => void;
    onOpenSheet: () => void;
  }

  let { epic, counts, isExpanded = false, onToggle, onOpenSheet }: Props = $props();

  // Compute progress percentage
  let progress = $derived(computeProgress(counts));

  // Status dot color mapping
  const getStatusColor = (status: string) => {
    if (status === 'active') return 'bg-primary';
    if (status === 'done') return 'bg-green-500';
    return 'bg-muted-foreground'; // canceled
  };
</script>

<!-- North Design: No heavy cards, light divider, minimal hover -->
<div
  data-testid="epic-row"
  class="relative w-full border-b border-border-divider hover:bg-surface-subtle transition-colors duration-150 group"
>
  <!-- Main Content Area -->
  <div class="flex items-start px-4 py-4 gap-3">
    <!-- Expand/Collapse Chevron -->
    <button
      onclick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      class="flex items-center shrink-0 pt-1 cursor-pointer"
      aria-label={isExpanded ? 'Collapse epic' : 'Expand epic'}
    >
      {#if isExpanded}
        <ChevronDown class="h-5 w-5 text-muted-foreground" />
      {:else}
        <ChevronRight class="h-5 w-5 text-muted-foreground" />
      {/if}
    </button>

    <!-- Status Dot -->
    <div class="flex items-center pt-1.5 shrink-0">
      <div class="w-1.5 h-1.5 rounded-full {getStatusColor(epic.status)}"></div>
    </div>

    <!-- Clickable Content Area -->
    <button onclick={onOpenSheet} class="flex-1 text-left min-w-0">
      <!-- Epic Name: 16px, weight 500 (medium bold-ish) -->
      <h3 class="text-section-header truncate">{epic.name}</h3>

      <!-- Counts Row with Badges -->
      <div class="flex gap-3 mt-2">
        <div class="flex items-center gap-1.5">
          <Badge variant="default" class="text-xs">{counts.ready}</Badge>
          <span class="text-metadata text-foreground-secondary">Ready</span>
        </div>
        <div class="flex items-center gap-1.5">
          <Badge variant="status-doing" class="text-xs">{counts.doing}</Badge>
          <span class="text-metadata text-foreground-secondary">Doing</span>
        </div>
        <div class="flex items-center gap-1.5">
          <Badge variant="status-in-review" class="text-xs">{counts.inReview}</Badge>
          <span class="text-metadata text-foreground-secondary">In Review</span>
        </div>
        <div class="flex items-center gap-1.5">
          <Badge variant="status-blocked" class="text-xs">{counts.blocked}</Badge>
          <span class="text-metadata text-foreground-secondary">Blocked</span>
        </div>
      </div>

      <!-- Progress Bar -->
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
    </button>
  </div>
</div>
