<script lang="ts">
  /**
   * TreeGrid Component - Unified Tree Grid (North Design System)
   *
   * Displays Projects → Epics → Issues → Sub-issues in a single consistent table
   * with inline editing, selection, and drag-drop support.
   *
   * North Design Principles:
   * - Calm structure, minimal noise
   * - List-first (not card-first)
   * - Status communicated subtly (dot + label)
   * - Quiet motion (150ms transitions)
   */

  import type { TreeNode, DragDropState } from '$lib/types/tree-grid';
  import type { Project, Epic, Issue } from '$lib/types';
  import type { IssueCounts } from '$lib/utils/issue-counts';
  import type { ProjectMetrics } from '$lib/utils/project-helpers';
  import TreeToolbar from './TreeToolbar.svelte';
  import TreeRow from './TreeRow.svelte';
  import AddRow from './AddRow.svelte';
  import { flattenTree, getVisibleNodes, calculateIndentation } from '$lib/utils/tree-grid-helpers';
  import { updateAllNodeRollups } from '$lib/utils/rollup-calculations';
  import { dndzone } from 'svelte-dnd-action';
  import { getValidDropTargets, isReparentDrop } from '$lib/utils/drag-drop-validation';
  import { calculateNewSortOrders, calculateReparentUpdates } from '$lib/utils/reorder';
  import { invalidateAll } from '$app/navigation';

  interface Props {
    projects: (Project & {
      epics?: Epic[];
      issues?: Issue[];
      counts?: IssueCounts;
      metrics?: ProjectMetrics;
    })[];
    expandedIds: Set<string>;
    selectedIds: Set<string>;
    editMode: boolean;
    onToggleExpand: (id: string) => void;
    onToggleSelect: (id: string) => void;
    onEditModeChange: (enabled: boolean) => void;
    onCellEdit: (nodeId: string, field: string, value: any) => void;
    onCreateChild: (parentId: string, parentType: string, data: { title: string }) => void;
    onBulkAction?: (action: string) => void;
    onShowToast?: (message: string, type: 'success' | 'error') => void;
  }

  let {
    projects,
    expandedIds,
    selectedIds,
    editMode,
    onToggleExpand,
    onToggleSelect,
    onEditModeChange,
    onCellEdit,
    onCreateChild,
    onBulkAction,
    onShowToast,
  }: Props = $props();

  // Flatten tree into nodes and calculate rollups
  let allNodes = $derived.by(() => {
    const nodes = flattenTree(projects);
    updateAllNodeRollups(nodes); // Calculate totalPoints and progress
    return nodes;
  });

  // Filter to visible nodes based on expansion
  let visibleNodes = $derived(getVisibleNodes(allNodes, expandedIds));

  // Drag-drop state
  let dragDropState = $state<DragDropState>({
    draggingNodeId: null,
    draggingNodeType: null,
    validDropTargetIds: new Set(),
  });

  // Disable drag when edit mode is OFF
  let dragDisabled = $derived(!editMode);

  // Mark nodes with drag metadata
  let nodesWithDragState = $derived.by(() => {
    return visibleNodes.map((node) => ({
      ...node,
      isDragging: node.id === dragDropState.draggingNodeId,
      isValidDropTarget: dragDropState.validDropTargetIds.has(node.id),
    }));
  });

  /**
   * Determines if an AddRow should be shown after the current node.
   * Returns the parent node if AddRow should be shown, null otherwise.
   */
  function shouldShowAddRowAfter(
    currentNode: TreeNode,
    nextNode: TreeNode | undefined,
    expandedIds: Set<string>,
    allNodes: TreeNode[],
  ): TreeNode | null {
    // Don't show add row if current node's parent isn't expanded
    if (!currentNode.parentId || !expandedIds.has(currentNode.parentId)) {
      return null;
    }

    // Find the parent node
    const parentNode = allNodes.find((n) => n.id === currentNode.parentId);
    if (!parentNode || parentNode.type === 'sub-issue') {
      return null; // Can't add children to sub-issues
    }

    // If there's no next node, this is the last node - show add row for its parent
    if (!nextNode) {
      return parentNode;
    }

    // If next node's parent is different, we've finished current parent's children
    if (nextNode.parentId !== currentNode.parentId) {
      return parentNode;
    }

    return null;
  }

  // Column definitions (per spec)
  const columns = [
    { key: 'select', header: '', width: '40px' },
    { key: 'title', header: 'Title', width: 'flex min-w-[340px]' },
    { key: 'status', header: 'Status', width: '140px' },
    { key: 'milestone', header: 'Milestone', width: '140px' },
    { key: 'sp', header: 'SP', width: '72px' },
    { key: 'total_sp', header: 'Total SP', width: '96px' },
    { key: 'progress', header: 'Progress', width: '140px' },
  ];

  // Drag-drop handlers
  function handleDragStart(e: any) {
    const draggingNode = nodesWithDragState.find((n) => n.id === e.detail.info.id);

    if (!draggingNode) return;

    dragDropState = {
      draggingNodeId: draggingNode.id,
      draggingNodeType: draggingNode.type,
      validDropTargetIds: getValidDropTargets(draggingNode, allNodes),
    };
  }

  function handleDragEnd() {
    // Clear drag state
    dragDropState = {
      draggingNodeId: null,
      draggingNodeType: null,
      validDropTargetIds: new Set(),
    };
  }

  function handleDndConsider(e: any) {
    // Update local visible nodes during drag (optimistic UI)
    visibleNodes = e.detail.items;
  }

  async function handleDndFinalize(e: any) {
    const { items, info } = e.detail;

    const sourceNode = allNodes.find((n) => n.id === info.id);
    if (!sourceNode) {
      handleDragEnd();
      return;
    }

    // Find the target node (node at drop position)
    const dropIndex = items.findIndex((n: TreeNode) => n.id === info.id);
    const targetNode = dropIndex > 0 ? items[dropIndex - 1] : items[0];

    if (!targetNode) {
      handleDragEnd();
      return;
    }

    // Check if valid drop
    if (!dragDropState.validDropTargetIds.has(targetNode.id)) {
      // Invalid drop - revert to original order
      visibleNodes = getVisibleNodes(allNodes, expandedIds);
      handleDragEnd();
      return;
    }

    // Determine if reparent or reorder
    const isReparent = isReparentDrop(sourceNode, targetNode);

    if (isReparent) {
      // Reparent operation
      const update = calculateReparentUpdates(sourceNode, targetNode, allNodes);
      await submitReparent(update);
    } else {
      // Reorder operation (same parent)
      const updates = calculateNewSortOrders(items.map((n: TreeNode) => n.data as any));
      await submitReorder(
        Array.from(updates.entries()).map(([id, sort_order]) => ({ id, sort_order })),
      );
    }

    handleDragEnd();
  }

  async function submitReorder(updates: { id: string; sort_order: number }[]) {
    const formData = new FormData();
    formData.append('updates', JSON.stringify(updates));

    try {
      const response = await fetch('?/reorderNodes', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        await invalidateAll();
        if (onShowToast) onShowToast('Reordered successfully', 'success');
      } else {
        if (onShowToast) onShowToast('Failed to reorder', 'error');
      }
    } catch (error) {
      console.error('Reorder error:', error);
      if (onShowToast) onShowToast('Failed to reorder', 'error');
    }
  }

  async function submitReparent(update: any) {
    const formData = new FormData();
    formData.append('update', JSON.stringify(update));

    try {
      const response = await fetch('?/reparentNode', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        await invalidateAll();
        if (onShowToast) onShowToast('Moved successfully', 'success');
      } else {
        if (onShowToast) onShowToast('Failed to move', 'error');
      }
    } catch (error) {
      console.error('Reparent error:', error);
      if (onShowToast) onShowToast('Failed to move', 'error');
    }
  }

  function handleBulkAction(action: string) {
    if (onBulkAction) {
      onBulkAction(action);
    }
  }
</script>

<div class="space-y-4">
  <!-- Toolbar -->
  <TreeToolbar
    {editMode}
    selectedCount={selectedIds.size}
    {onEditModeChange}
    onBulkAction={handleBulkAction}
  />

  <!-- Tree Grid Table -->
  <div class="border border-border-divider rounded-lg overflow-hidden bg-surface">
    <table class="w-full">
      <!-- Header Row -->
      <thead class="bg-transparent">
        <tr class="border-b border-border-divider">
          {#each columns as col}
            <th
              class="text-left py-3 px-4 text-metadata uppercase text-foreground-muted tracking-wide"
              style="width: {col.width}"
            >
              {col.header}
            </th>
          {/each}
        </tr>
      </thead>

      <!-- Body Rows -->
      <tbody
        use:dndzone={{
          items: nodesWithDragState,
          dragDisabled,
          flipDurationMs: 150,
          type: 'tree-nodes',
        }}
        ondragstart={handleDragStart}
        ondragend={handleDragEnd}
        onconsider={handleDndConsider}
        onfinalize={handleDndFinalize}
      >
        {#each nodesWithDragState as node, index (node.id)}
          <TreeRow
            {node}
            {allNodes}
            isExpanded={expandedIds.has(node.id)}
            isSelected={selectedIds.has(node.id)}
            {editMode}
            {dragDropState}
            {onToggleExpand}
            {onToggleSelect}
            {onCellEdit}
          />

          <!-- Check if we should show AddRow after this node -->
          {@const nextNode = nodesWithDragState[index + 1]}
          {@const parentNode = shouldShowAddRowAfter(node, nextNode, expandedIds, allNodes)}
          {#if parentNode}
            {@const childLevel = (parentNode.level + 1) as 1 | 2 | 3}
            <AddRow
              {parentNode}
              level={childLevel}
              indentation={calculateIndentation(childLevel)}
              onCreate={(data) => onCreateChild(parentNode.id, parentNode.type, data)}
            />
          {/if}
        {/each}
      </tbody>
    </table>
  </div>
</div>
