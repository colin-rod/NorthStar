<script lang="ts">
  /**
   * StoryPointsCell Component - Story Points Input
   *
   * Display mode: Number or blank
   * Edit mode: Dropdown select (1, 2, 3, 5, 8, 13, 21)
   *
   * Only visible/editable for issues (not projects/epics)
   */

  import type { TreeNode } from '$lib/types/tree-grid';
  import type { Issue } from '$lib/types';

  interface Props {
    node: TreeNode;
    onEdit: (value: number | null) => void;
  }

  let { node, onEdit }: Props = $props();

  // Only applicable for issues
  const isApplicable = $derived(node.type === 'issue');

  // Get story points from node data
  const storyPoints = $derived.by(() => {
    if (!isApplicable) return null;
    return (node.data as Issue).story_points;
  });

  const allowedValues = [1, 2, 3, 5, 8, 13, 21];
</script>

{#if !isApplicable}
  <!-- Project/Epic: Blank -->
  <span></span>
{:else}
  <!-- Display Mode: Number or blank -->
  <span class="text-foreground {storyPoints ? '' : 'text-muted-foreground'}">
    {storyPoints || ''}
  </span>
{/if}
