<script lang="ts">
  /**
   * StatusCell Component - Status Indicator (Dot + Label)
   *
   * Display mode: 5-6px colored dot + status label
   * Edit mode: Dropdown select with all status options
   *
   * All levels (project, epic, issue, sub-issue) have status.
   */

  import type { TreeNode } from '$lib/types/tree-grid';
  import type { Project, Epic, Issue } from '$lib/types';

  interface Props {
    node: TreeNode;
    editMode: boolean;
    compact?: boolean; // For mobile view
    onEdit: (value: string) => void;
  }

  let { node, editMode, compact = false, onEdit }: Props = $props();

  // Get status from node data
  // Note: Projects don't currently have status in the schema
  const status = $derived.by(() => {
    if (node.type === 'project') {
      return 'active'; // Default for projects
    }
    return (node.data as Epic | Issue).status;
  });

  const statusOptions = [
    { value: 'todo', label: 'Todo', color: 'bg-status-todo' },
    { value: 'doing', label: 'In Progress', color: 'bg-status-doing' },
    { value: 'in_review', label: 'In Review', color: 'bg-status-in-review' },
    { value: 'done', label: 'Done', color: 'bg-status-done' },
    { value: 'canceled', label: 'Canceled', color: 'bg-status-canceled' },
    // Note: 'blocked' is computed, not a stored status
  ];

  const currentOption = $derived(statusOptions.find((o) => o.value === status));
</script>

{#if editMode && !compact}
  <!-- Edit Mode: Dropdown -->
  <select
    value={status}
    onchange={(e) => onEdit(e.currentTarget.value)}
    class="h-8 px-2 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-accent bg-surface"
  >
    {#each statusOptions as option}
      <option value={option.value}>{option.label}</option>
    {/each}
  </select>
{:else}
  <!-- Display Mode: Dot + Label -->
  <div class="flex items-center gap-2">
    <div class="w-1.5 h-1.5 rounded-full {currentOption?.color || 'bg-gray-400'}"></div>
    <span class="text-foreground {compact ? 'text-xs' : ''}">{currentOption?.label || status}</span>
  </div>
{/if}
