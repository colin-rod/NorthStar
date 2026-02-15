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

  import type { TreeNode } from '$lib/types/tree-grid';
  import type { Project, Epic, Issue } from '$lib/types';
  import type { IssueCounts } from '$lib/utils/issue-counts';
  import type { ProjectMetrics } from '$lib/utils/project-helpers';
  import TreeToolbar from './TreeToolbar.svelte';
  import TreeRow from './TreeRow.svelte';
  import AddRow from './AddRow.svelte';
  import { flattenTree, getVisibleNodes, calculateIndentation } from '$lib/utils/tree-grid-helpers';
  import { updateAllNodeRollups } from '$lib/utils/rollup-calculations';

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
  }: Props = $props();

  // Flatten tree into nodes and calculate rollups
  let allNodes = $derived.by(() => {
    const nodes = flattenTree(projects);
    updateAllNodeRollups(nodes); // Calculate totalPoints and progress
    return nodes;
  });

  // Filter to visible nodes based on expansion
  let visibleNodes = $derived(getVisibleNodes(allNodes, expandedIds));

  // Collect all expanded parent nodes that can have children
  let expandedParentsWithAddRow = $derived.by(() => {
    return visibleNodes.filter((node) => expandedIds.has(node.id) && node.type !== 'sub-issue');
  });

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
      <tbody>
        {#each visibleNodes as node (node.id)}
          <TreeRow
            {node}
            {allNodes}
            isExpanded={expandedIds.has(node.id)}
            isSelected={selectedIds.has(node.id)}
            {editMode}
            {onToggleExpand}
            {onToggleSelect}
            {onCellEdit}
          />
        {/each}

        <!-- Add Rows (bottom of table) -->
        {#each expandedParentsWithAddRow as parentNode (parentNode.id)}
          {@const childLevel = (parentNode.level + 1) as 1 | 2 | 3}
          <AddRow
            {parentNode}
            level={childLevel}
            indentation={calculateIndentation(childLevel)}
            onCreate={(data) => onCreateChild(parentNode.id, parentNode.type, data)}
          />
        {/each}
      </tbody>
    </table>
  </div>
</div>
