<script lang="ts">
  /**
   * ProgressCell Component - Progress Bar + Percentage (Read-Only)
   *
   * Displays:
   * - 4px thin progress bar
   * - Percentage text
   *
   * Visible for projects, epics, and issues (not sub-issues)
   */

  import type { TreeNode } from '$lib/types/tree-grid';

  interface Props {
    node: TreeNode;
  }

  let { node }: Props = $props();

  // progress is pre-calculated in node
  const progress = $derived(node.progress);
  const fillClass = $derived(
    !progress
      ? ''
      : progress.percentage === 100
        ? 'bg-green-500'
        : progress.percentage >= 75
          ? 'bg-emerald-500'
          : progress.percentage >= 50
            ? 'bg-blue-500'
            : progress.percentage >= 25
              ? 'bg-amber-500'
              : 'bg-red-500',
  );
</script>

{#if progress}
  <div class="flex items-center gap-2">
    <!-- Progress Bar -->
    <div class="flex-1 h-1 bg-muted rounded-full overflow-hidden">
      <div
        class="h-full {fillClass} rounded-full transition-all duration-300"
        style="width: {progress.percentage}%"
      ></div>
    </div>

    <!-- Percentage Text -->
    <span class="text-metadata text-foreground-secondary shrink-0 min-w-[3ch]">
      {progress.percentage}%
    </span>
  </div>
{:else}
  <!-- Sub-issue or no progress -->
  <span></span>
{/if}
