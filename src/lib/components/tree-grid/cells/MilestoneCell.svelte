<script lang="ts">
  /**
   * MilestoneCell Component - Milestone Dropdown
   *
   * Display mode: Milestone name or "—"
   * Edit mode: Dropdown select (searchable future enhancement)
   *
   * Disabled for projects (projects don't have milestones)
   */

  import type { TreeNode } from '$lib/types/tree-grid';
  import type { Issue } from '$lib/types';

  interface Props {
    node: TreeNode;
  }

  let { node }: Props = $props();

  // Only issues have milestones
  const isApplicable = $derived(node.type === 'issue');

  // Get milestone from node data
  const milestone = $derived.by(() => {
    if (!isApplicable) return null;
    const data = node.data as Issue;
    return data.milestone || null;
  });
</script>

{#if !isApplicable}
  <!-- Project: Show em dash -->
  <span class="text-muted-foreground">—</span>
{:else}
  <!-- Display Mode: Milestone name or em dash -->
  <span class="text-foreground {milestone ? '' : 'text-muted-foreground'}">
    {milestone?.name || '—'}
  </span>
{/if}
