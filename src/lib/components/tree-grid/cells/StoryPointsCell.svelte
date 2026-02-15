<script lang="ts">
  /**
   * StoryPointsCell Component - Story Points Input
   *
   * Display mode: Number or blank
   * Edit mode: Dropdown select (1, 2, 3, 5, 8, 13, 21)
   *
   * Only visible/editable for issues and sub-issues (not projects/epics)
   */

  import type { TreeNode } from '$lib/types/tree-grid';
  import type { Issue } from '$lib/types';

  interface Props {
    node: TreeNode;
    editMode: boolean;
    onEdit: (value: number | null) => void;
  }

  let { node, editMode, onEdit }: Props = $props();

  // Only applicable for issues and sub-issues
  const isApplicable = $derived(node.type === 'issue' || node.type === 'sub-issue');

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
{:else if editMode}
  <!-- Edit Mode: Dropdown -->
  <select
    value={storyPoints || ''}
    onchange={(e) => {
      const val = e.currentTarget.value;
      onEdit(val ? parseInt(val, 10) : null);
    }}
    class="h-8 px-2 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-accent bg-surface"
  >
    <option value="">—</option>
    {#each allowedValues as val}
      <option value={val}>{val}</option>
    {/each}
  </select>
{:else}
  <!-- Display Mode: Number or blank -->
  <span class="text-foreground {storyPoints ? '' : 'text-muted-foreground'}">
    {storyPoints || ''}
  </span>
{/if}
