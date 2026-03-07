<script lang="ts">
  /**
   * TreeRow Component - Single Row in Tree Grid
   *
   * Renders a single row with level-based styling and all column cells.
   * Supports selection, expansion, and inline editing.
   */

  import type { TreeNode, DragDropState } from '$lib/types/tree-grid';
  import type { Issue, Project, Epic } from '$lib/types';
  import type { IssueCounts } from '$lib/utils/issue-counts';
  import type { ProjectMetrics } from '$lib/utils/project-helpers';
  import { calculateIndentation } from '$lib/utils/tree-grid-helpers';
  import SelectionCell from './cells/SelectionCell.svelte';
  import DragHandleCell from './cells/DragHandleCell.svelte';
  import TitleCell from './cells/TitleCell.svelte';
  import StatusCell from './cells/StatusCell.svelte';

  import TotalPointsCell from './cells/TotalPointsCell.svelte';
  import ProgressCell from './cells/ProgressCell.svelte';
  import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
  import Plus from '@lucide/svelte/icons/plus';
  import Ellipsis from '@lucide/svelte/icons/ellipsis';

  interface Props {
    node: TreeNode;
    allNodes: TreeNode[];
    isExpanded: boolean;
    expandedIds: Set<string>;
    isSelected: boolean;
    dragDropState?: DragDropState;
    onToggleExpand: (id: string) => void;
    onToggleSelect: (id: string) => void;
    onCellEdit: (nodeId: string, field: string, value: any) => void;
    onIssueClick?: (issue: Issue) => void;
    onProjectClick?: (
      project: Project,
      counts: IssueCounts,
      metrics: ProjectMetrics,
      epics: Epic[],
    ) => void;
    onEpicClick?: (epic: Epic, counts: IssueCounts) => void;
    onContextMenu?: (node: TreeNode, event: MouseEvent) => void;
    onAddChild?: (node: TreeNode) => void;
    showReorderHint?: boolean;
    editingNodeId?: string | null;
    onStopEdit?: () => void;
  }

  let {
    node,
    allNodes,
    isExpanded,
    expandedIds,
    isSelected,
    dragDropState,
    onToggleExpand,
    onToggleSelect,
    onCellEdit,
    onIssueClick,
    onProjectClick,
    onEpicClick,
    onContextMenu,
    onAddChild,
    showReorderHint = false,
    editingNodeId = null,
    onStopEdit,
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

  // Derive drag state classes for visual feedback
  const dragClasses = $derived.by(() => {
    const classes = [];

    if (node.isDragging) {
      classes.push('opacity-40', 'scale-105', 'shadow-lg');
    }

    if (node.isValidDropTarget) {
      classes.push('bg-primary/10', 'border-l-2', 'border-primary');
    } else if (dragDropState?.draggingNodeId && !node.isValidDropTarget) {
      classes.push('opacity-50');
    }

    return classes.join(' ');
  });

  // Derive expansion state classes for visual feedback
  const expansionClasses = $derived.by(() => {
    const classes = [];

    // If nothing is expanded, no special styling
    if (expandedIds.size === 0) {
      return '';
    }

    // Check if THIS row is expanded
    if (isExpanded) {
      // Highlighted: subtle background accent
      classes.push('bg-primary/5', 'ring-1', 'ring-primary/20');
      return classes.join(' ');
    }

    // Check if this row is a CHILD of an expanded row
    if (node.parentId && expandedIds.has(node.parentId)) {
      // Child of expanded row: keep full opacity
      return '';
    }

    // Otherwise: dim this row
    classes.push('opacity-60');
    return classes.join(' ');
  });

  // Handle right-click to open context menu
  function handleContextMenuEvent(event: MouseEvent) {
    event.preventDefault();
    onContextMenu?.(node, event);
  }

  function handleOpenClick(event: MouseEvent) {
    event.stopPropagation();
    handleDoubleClick();
  }

  function handleAddChildClick(event: MouseEvent) {
    event.stopPropagation();
    onAddChild?.(node);
  }

  function handleMoreClick(event: MouseEvent) {
    event.stopPropagation();
    onContextMenu?.(node, event);
  }

  // Handle double-click to open drawer
  function handleDoubleClick() {
    if (node.type === 'issue' && onIssueClick) {
      onIssueClick(node.data as Issue);
    } else if (node.type === 'project' && onProjectClick) {
      const projectEpics = allNodes
        .filter((n) => n.parentId === node.id && n.type === 'epic')
        .map((n) => n.data as Epic);
      onProjectClick(node.data as Project, node.counts, node.metrics, projectEpics);
    } else if (node.type === 'epic' && onEpicClick) {
      onEpicClick(node.data as Epic, node.counts);
    }
  }
</script>

<tr
  class="relative border-b border-border-divider hover:bg-surface-subtle transition-all duration-150 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset {bgClass} {isSelected
    ? 'bg-primary-tint'
    : ''} {dragClasses} {expansionClasses}"
  data-node-id={node.id}
  data-node-type={node.type}
  data-node-level={node.level}
  tabindex="0"
  oncontextmenu={handleContextMenuEvent}
  ondblclick={handleDoubleClick}
>
  <!-- Drag Handle -->
  <td class="py-4 px-4 hidden md:table-cell">
    <DragHandleCell />
  </td>

  <!-- Selection Checkbox -->
  <td class="py-4 px-4 hidden md:table-cell">
    <SelectionCell checked={isSelected} onToggle={() => onToggleSelect(node.id)} />
  </td>

  <!-- Title with Indentation + Chevron -->
  <td class="py-4 px-4">
    <TitleCell
      {node}
      {allNodes}
      {isExpanded}
      indentation={calculateIndentation(node.level)}
      {fontWeight}
      isEditing={editingNodeId === node.id}
      onToggleExpand={() => onToggleExpand(node.id)}
      onEdit={(value) => onCellEdit(node.id, 'title', value)}
      onStopEdit={() => onStopEdit?.()}
    />
  </td>

  <!-- Status -->
  <td class="py-4 px-4">
    <StatusCell {node} onEdit={(value) => onCellEdit(node.id, 'status', value)} />
  </td>

  <!-- Total Story Points (Rollup) -->
  <td class="py-4 px-4 hidden md:table-cell">
    <TotalPointsCell {node} />
  </td>

  <!-- Progress -->
  <td class="py-4 px-4 hidden md:table-cell">
    <ProgressCell {node} />
  </td>

  <!-- Row Actions (hover/focus reveal) -->
  <td class="py-2 px-2 hidden md:table-cell">
    <div
      class="flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-100"
    >
      <button
        type="button"
        class="p-1 rounded hover:bg-surface-subtle text-muted-foreground hover:text-foreground"
        title="Open detail"
        onclick={handleOpenClick}
      >
        <ArrowUpRight class="h-3.5 w-3.5" />
      </button>
      {#if node.type !== 'issue'}
        <button
          type="button"
          class="p-1 rounded hover:bg-surface-subtle text-muted-foreground hover:text-foreground"
          title={node.type === 'project' ? 'Add epic' : 'Add issue'}
          onclick={handleAddChildClick}
        >
          <Plus class="h-3.5 w-3.5" />
        </button>
      {/if}
      <button
        type="button"
        class="p-1 rounded hover:bg-surface-subtle text-muted-foreground hover:text-foreground"
        title="More actions"
        onclick={handleMoreClick}
      >
        <Ellipsis class="h-3.5 w-3.5" />
      </button>
    </div>
  </td>
</tr>
