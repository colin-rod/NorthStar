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
  import type { Issue, Epic } from '$lib/types';

  interface Props {
    node: TreeNode;
    onEdit: (value: string | null) => void;
  }

  let { node, onEdit }: Props = $props();

  // Projects don't have milestones
  const isApplicable = $derived(node.type !== 'project');

  // Get milestone from node data (only issues have milestones)
  const milestone = $derived.by(() => {
    if (!isApplicable || node.type === 'epic') return null;
    const data = node.data as Issue;
    return data.milestone || null;
  });

  const milestoneId = $derived.by(() => {
    if (!isApplicable || node.type === 'epic') return null;
    const data = node.data as Issue;
    return data.milestone_id || null;
  });

  // TODO: Load available milestones from context/store
  const availableMilestones: any[] = [];
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
