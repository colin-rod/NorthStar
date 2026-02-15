<script lang="ts">
  /**
   * TreeRow Component - Single Row in Tree Grid
   *
   * Renders a single row with level-based styling and all column cells.
   * Supports selection, expansion, and inline editing.
   */

  import type { TreeNode } from '$lib/types/tree-grid';
  import { calculateIndentation } from '$lib/utils/tree-grid-helpers';
  import SelectionCell from './cells/SelectionCell.svelte';
  import TitleCell from './cells/TitleCell.svelte';
  import StatusCell from './cells/StatusCell.svelte';
  import MilestoneCell from './cells/MilestoneCell.svelte';
  import StoryPointsCell from './cells/StoryPointsCell.svelte';
  import TotalPointsCell from './cells/TotalPointsCell.svelte';
  import ProgressCell from './cells/ProgressCell.svelte';

  interface Props {
    node: TreeNode;
    allNodes: TreeNode[];
    isExpanded: boolean;
    isSelected: boolean;
    editMode: boolean;
    onToggleExpand: (id: string) => void;
    onToggleSelect: (id: string) => void;
    onCellEdit: (nodeId: string, field: string, value: any) => void;
  }

  let {
    node,
    allNodes,
    isExpanded,
    isSelected,
    editMode,
    onToggleExpand,
    onToggleSelect,
    onCellEdit,
  }: Props = $props();

  // Level-based background shading (per spec)
  const bgClass = $derived.by(() => {
    if (node.type === 'issue') return 'bg-surface-subtle/30';
    return 'bg-surface';
  });

  // Typography weight per level
  const fontWeight = $derived.by(() => {
    if (node.type === 'project') return 'font-semibold';
    return 'font-medium';
  });

  // Handle double-click to open drawer
  function handleDoubleClick() {
    // TODO: Emit event to open drawer for this node
    // This will be wired up when integrating with the page
  }
</script>

<tr
  class="border-b border-border-divider hover:bg-surface-subtle transition-colors duration-150 group {bgClass} {isSelected
    ? 'bg-primary-tint'
    : ''}"
  data-node-id={node.id}
  data-node-type={node.type}
  data-node-level={node.level}
  ondblclick={handleDoubleClick}
>
  <!-- Selection Checkbox -->
  <td class="py-4 px-4">
    <SelectionCell checked={isSelected} onToggle={() => onToggleSelect(node.id)} />
  </td>

  <!-- Title with Indentation + Chevron -->
  <td class="py-4 px-4">
    <TitleCell
      {node}
      {isExpanded}
      indentation={calculateIndentation(node.level)}
      {fontWeight}
      {editMode}
      onToggleExpand={() => onToggleExpand(node.id)}
      onEdit={(value) => onCellEdit(node.id, 'title', value)}
    />
  </td>

  <!-- Status -->
  <td class="py-4 px-4">
    <StatusCell {node} {editMode} onEdit={(value) => onCellEdit(node.id, 'status', value)} />
  </td>

  <!-- Milestone -->
  <td class="py-4 px-4">
    <MilestoneCell
      {node}
      {editMode}
      onEdit={(value) => onCellEdit(node.id, 'milestone_id', value)}
    />
  </td>

  <!-- Story Points -->
  <td class="py-4 px-4">
    <StoryPointsCell
      {node}
      {editMode}
      onEdit={(value) => onCellEdit(node.id, 'story_points', value)}
    />
  </td>

  <!-- Total Story Points (Rollup) -->
  <td class="py-4 px-4">
    <TotalPointsCell {node} />
  </td>

  <!-- Progress -->
  <td class="py-4 px-4">
    <ProgressCell {node} />
  </td>
</tr>
