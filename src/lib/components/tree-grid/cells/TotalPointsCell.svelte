<script lang="ts">
  /**
   * TotalPointsCell Component - Total Story Points Rollup (Read-Only)
   *
   * Displays computed total story points:
   * - Project: Sum of all epic totals
   * - Epic: Sum of all issue totals
   * - Issue: Issue SP + sum of sub-issue SP
   * - Sub-issue: Blank (no rollup)
   */

  import type { TreeNode } from '$lib/types/tree-grid';

  interface Props {
    node: TreeNode;
  }

  let { node }: Props = $props();

  // totalPoints is pre-calculated in node
  const totalPoints = $derived(node.totalPoints);
</script>

{#if totalPoints !== null && totalPoints > 0}
  <span class="text-foreground font-medium">{totalPoints}</span>
{:else}
  <span class="text-muted-foreground">—</span>
{/if}
