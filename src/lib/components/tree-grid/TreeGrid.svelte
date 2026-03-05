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
  import GroupHeader from '$lib/components/GroupHeader.svelte';
  import { flattenTree, getVisibleNodes, calculateIndentation } from '$lib/utils/tree-grid-helpers';
  import { updateAllNodeRollups } from '$lib/utils/rollup-calculations';
  import { dndzone } from 'svelte-dnd-action';
  import { getValidDropTargets, isReparentDrop } from '$lib/utils/drag-drop-validation';
  import { calculateNewSortOrders, calculateReparentUpdates } from '$lib/utils/reorder';
  import { invalidateAll } from '$app/navigation';
  import { buildBreadcrumb } from '$lib/utils/breadcrumb';
  import { groupIssues } from '$lib/utils/group-issues';
  import { dismissReorderHint } from '$lib/stores/ui-hints';

  interface Props {
    projects: (Project & {
      epics?: Epic[];
      issues?: Issue[];
      counts?: IssueCounts;
      metrics?: ProjectMetrics;
    })[];
    expandedIds: Set<string>;
    selectedIds: Set<string>;
    groupBy?: string;
    onToggleExpand: (id: string) => void;
    onToggleSelect: (id: string) => void;
    onCellEdit: (nodeId: string, field: string, value: any) => void;
    onCreateChild: (parentId: string, parentType: string, data: { title: string }) => void;
    onBulkAction?: (action: string) => void;
    onShowToast?: (message: string, type: 'success' | 'error') => void;
    onIssueClick?: (issue: Issue) => void;
    onProjectClick?: (
      project: Project,
      counts: IssueCounts,
      metrics: ProjectMetrics,
      epics: Epic[],
    ) => void;
    onEpicClick?: (epic: Epic, counts: IssueCounts) => void;
    onContextMenu?: (node: import('$lib/types/tree-grid').TreeNode, event: MouseEvent) => void;
    editingNodeId?: string | null;
    onStopEditNode?: () => void;
  }

  let {
    projects,
    expandedIds,
    selectedIds,
    groupBy = 'none',
    onToggleExpand,
    onToggleSelect,
    onCellEdit,
    onCreateChild,
    onBulkAction,
    onShowToast,
    onIssueClick,
    onProjectClick,
    onEpicClick,
    onContextMenu,
    editingNodeId = null,
    onStopEditNode,
  }: Props = $props();

  // Flatten tree into nodes and calculate rollups
  let allNodes = $derived.by(() => {
    const nodes = flattenTree(projects);
    updateAllNodeRollups(nodes); // Calculate totalPoints and progress
    return nodes;
  });

  // Filter to visible nodes based on expansion
  let visibleNodes = $derived(getVisibleNodes(allNodes, expandedIds));

  // When grouping is enabled, inject group headers between issue groups within each epic
  interface GroupHeaderNode {
    id: string;
    type: 'group-header';
    level: 2;
    parentId: string;
    groupKey: string;
    label: string;
    issueCount: number;
    totalStoryPoints: number;
    completionPercent: number;
    isExpanded: boolean;
  }

  type DisplayNode = TreeNode | GroupHeaderNode;

  let groupExpandedIds = $state<Set<string>>(new Set());

  let displayNodes = $derived.by((): DisplayNode[] => {
    if (groupBy === 'none') {
      return visibleNodes;
    }

    const result: DisplayNode[] = [];

    for (let i = 0; i < visibleNodes.length; i++) {
      const node = visibleNodes[i];
      result.push(node);

      // Check if this is an expanded epic
      if (node.type === 'epic' && expandedIds.has(node.id)) {
        // Get all child issue nodes once, indexed by id for O(1) group lookup
        const epicIssueNodes = visibleNodes.filter(
          (n) => n.parentId === node.id && n.type === 'issue',
        );
        const epicIssueNodeById = new Map(epicIssueNodes.map((n) => [n.id, n]));
        const epicIssues = epicIssueNodes.map((n) => n.data as Issue);

        if (epicIssues.length > 0) {
          // Group the issues
          const groups = groupIssues(epicIssues, groupBy);

          // For each group, add group header and issues
          for (const group of groups) {
            const groupHeaderId = `${node.id}-group-${group.groupKey}`;
            const isGroupExpanded = groupExpandedIds.has(groupHeaderId);

            // Calculate completion percentage
            const doneIssues = group.items.filter((issue) => issue.status === 'done').length;
            const completionPercent = group.count > 0 ? (doneIssues / group.count) * 100 : 0;

            // Calculate total story points
            const totalStoryPoints = group.items.reduce(
              (sum, issue) => sum + (issue.story_points || 0),
              0,
            );

            // Add group header
            result.push({
              id: groupHeaderId,
              type: 'group-header',
              level: 2,
              parentId: node.id,
              groupKey: group.groupKey,
              label: group.label || 'Ungrouped',
              issueCount: group.count,
              totalStoryPoints,
              completionPercent,
              isExpanded: isGroupExpanded,
            });

            // Add issues in this group (only if group is expanded)
            if (isGroupExpanded) {
              const groupIssueNodes = group.items
                .map((issue) => epicIssueNodeById.get(issue.id))
                .filter((n): n is TreeNode => n !== undefined);
              result.push(...groupIssueNodes);
            }
          }

          // Skip the original issue nodes (we've already added them via groups)
          // Move index forward to skip all issues belonging to this epic
          while (i + 1 < visibleNodes.length && visibleNodes[i + 1].parentId === node.id) {
            i++;
          }
        }
      }
    }

    return result;
  });

  // Get the deepest expanded node for breadcrumb
  // When multiple nodes are expanded (e.g., project + epic), use the deepest one
  // so breadcrumb traces up from deepest level to root
  let expandedId = $derived.by(() => {
    if (expandedIds.size === 0) return null;

    // Find the deepest expanded node by level (0=project, 1=epic, 2=issue, 3=sub-issue)
    const deepestNode = allNodes
      .filter((n) => expandedIds.has(n.id))
      .sort((a, b) => b.level - a.level)[0];

    return deepestNode?.id || null;
  });

  // Compute breadcrumb for expanded node
  let breadcrumb = $derived(buildBreadcrumb(expandedId, allNodes));

  // Drag-drop state
  let dragDropState = $state<DragDropState>({
    draggingNodeId: null,
    draggingNodeType: null,
    validDropTargetIds: new Set(),
  });

  // Drag is always disabled (edit mode removed)
  const dragDisabled = true;

  // Mark nodes with drag metadata
  let nodesWithDragState = $derived.by(() => {
    return displayNodes.map((node) => {
      if (node.type === 'group-header') {
        return node; // Group headers don't have drag state
      }
      return {
        ...node,
        isDragging: node.id === dragDropState.draggingNodeId,
        isValidDropTarget: dragDropState.validDropTargetIds.has(node.id),
      };
    });
  });

  function toggleGroupExpansion(groupId: string) {
    const newExpanded = new Set(groupExpandedIds);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    groupExpandedIds = newExpanded;
  }

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
    if (!parentNode) {
      return null;
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
    { key: 'drag', header: '', width: '40px', hideOnMobile: true },
    { key: 'select', header: '', width: '40px', hideOnMobile: true },
    { key: 'title', header: 'Title', width: 'flex min-w-[340px]', hideOnMobile: false },
    { key: 'status', header: 'Status', width: '140px', hideOnMobile: false },
    { key: 'milestone', header: 'Milestone', width: '160px', hideOnMobile: true },
    { key: 'total_sp', header: 'Total pts', width: '96px', hideOnMobile: true },
    { key: 'progress', header: 'Progress', width: '140px', hideOnMobile: true },
  ];

  // Drag-drop handlers
  function handleDragStart(e: any) {
    dismissReorderHint();
    const draggingNode = nodesWithDragState.find((n) => n.id === e.detail.info.id);

    if (!draggingNode || draggingNode.type === 'group-header') return;

    dragDropState = {
      draggingNodeId: draggingNode.id,
      draggingNodeType: draggingNode.type,
      validDropTargetIds: getValidDropTargets(draggingNode as TreeNode, allNodes),
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
  <TreeToolbar {breadcrumb} selectedCount={selectedIds.size} onBulkAction={handleBulkAction} />

  <!-- Tree Grid Table -->
  <div class="border border-border-divider rounded-lg overflow-hidden bg-surface">
    <table class="w-full">
      <!-- Header Row -->
      <thead class="bg-transparent">
        <tr class="border-b border-border-divider">
          {#each columns as col}
            <th
              class="text-left py-3 px-4 text-metadata uppercase text-foreground-muted tracking-wide {col.hideOnMobile
                ? 'hidden md:table-cell'
                : ''}"
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
          items: nodesWithDragState.filter((n) => n.type !== 'group-header'),
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
          {#if node.type === 'group-header'}
            <!-- Render GroupHeader -->
            <tr>
              <td colspan={columns.length} class="p-0">
                <GroupHeader
                  groupName={node.label}
                  issueCount={node.issueCount}
                  totalStoryPoints={node.totalStoryPoints}
                  completionPercent={node.completionPercent}
                  isExpanded={node.isExpanded}
                  onclick={() => toggleGroupExpansion(node.id)}
                />
              </td>
            </tr>
          {:else}
            <TreeRow
              {node}
              {allNodes}
              isExpanded={expandedIds.has(node.id)}
              {expandedIds}
              isSelected={selectedIds.has(node.id)}
              {dragDropState}
              {onToggleExpand}
              {onToggleSelect}
              {onCellEdit}
              {onIssueClick}
              {onProjectClick}
              {onEpicClick}
              {onContextMenu}
              {editingNodeId}
              onStopEdit={onStopEditNode}
            />

            <!-- Check if we should show AddRow after this node -->
            {@const nextNode = nodesWithDragState[index + 1]}
            {@const nextTreeNode =
              nextNode && nextNode.type !== 'group-header' ? (nextNode as TreeNode) : undefined}
            {@const parentNode = shouldShowAddRowAfter(node, nextTreeNode, expandedIds, allNodes)}
            {#if parentNode}
              {@const childLevel = (parentNode.level + 1) as 1 | 2}
              <AddRow
                {parentNode}
                level={childLevel}
                indentation={calculateIndentation(childLevel)}
                onCreate={(data) => onCreateChild(parentNode.id, parentNode.type, data)}
              />
            {:else if node.type === 'epic' && expandedIds.has(node.id) && groupBy === 'none'}
              <!-- Show AddRow after expanded epic with no visible children (only when not grouping) -->
              {@const hasVisibleChildren = nodesWithDragState.some(
                (n) => n.type !== 'group-header' && n.parentId === node.id && n.type === 'issue',
              )}
              {#if !hasVisibleChildren}
                {@const childLevel = 2}
                <AddRow
                  parentNode={node}
                  level={childLevel}
                  indentation={calculateIndentation(childLevel)}
                  onCreate={(data) => onCreateChild(node.id, node.type, data)}
                />
              {/if}
            {/if}
          {/if}
        {/each}
      </tbody>
    </table>
  </div>
</div>
