<script lang="ts">
  /**
   * ProjectRow Component - North Design System
   *
   * Displays a single project in a mobile-optimized row view with drill-down capability.
   * Used in: Projects list view (mobile)
   *
   * North Design Principles:
   * - List-first, no heavy cards
   * - Light divider lines, slight hover tint
   * - 16px vertical padding
   * - Project name: 16px, weight 500 (medium bold-ish)
   * - Metadata: 13px, secondary color
   */

  import type { Project } from '$lib/types';
  import type { IssueCounts } from '$lib/utils/issue-counts';
  import type { ProjectMetrics } from '$lib/utils/project-helpers';
  import { computeProgress } from '$lib/utils/issue-counts';
  import Badge from '$lib/components/ui/badge/badge.svelte';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';

  interface Props {
    project: Project;
    counts: IssueCounts;
    metrics: ProjectMetrics;
    isExpanded?: boolean;
    onToggle: () => void;
    onNavigate: () => void;
  }

  let { project, counts, metrics, isExpanded = false, onToggle, onNavigate }: Props = $props();

  // Compute progress percentage
  let progress = $derived(computeProgress(counts));
</script>

<!-- North Design: No heavy cards, light divider, minimal hover -->
<div
  data-testid="project-row"
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
      aria-label={isExpanded ? 'Collapse project' : 'Expand project'}
    >
      {#if isExpanded}
        <ChevronDown class="h-5 w-5 text-muted-foreground" />
      {:else}
        <ChevronRight class="h-5 w-5 text-muted-foreground" />
      {/if}
    </button>

    <!-- Clickable Content Area -->
    <button onclick={onNavigate} class="flex-1 text-left min-w-0">
      <!-- Project Name: 16px, weight 500 (medium bold-ish) -->
      <h3 class="text-issue-title truncate">
        <span class="text-muted-foreground font-mono text-sm">P-{project.number}</span>
        <span class="mx-1 text-muted-foreground">·</span>
        {project.name}
      </h3>

      <!-- Metadata Row: 13px, secondary color -->
      <p class="text-metadata mt-1 text-foreground-secondary">
        {metrics.totalIssues}
        {metrics.totalIssues === 1 ? 'issue' : 'issues'}
        •
        {metrics.activeStoryPoints}/{metrics.totalStoryPoints} pts •
        {progress.percentage}% complete
      </p>

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
