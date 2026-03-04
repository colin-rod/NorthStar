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
    compact?: boolean; // For mobile view
    onEdit: (value: string) => void;
  }

  let { node, compact = false, onEdit }: Props = $props();

  // Get status from node data
  const status = $derived.by(() => {
    if (node.type === 'project') {
      return (node.data as Project).status ?? 'active';
    }
    return (node.data as Epic | Issue).status;
  });

  const projectStatusOptions = [
    { value: 'backlog', label: 'Backlog', color: 'bg-status-todo' },
    { value: 'planned', label: 'Planned', color: 'bg-status-todo' },
    { value: 'active', label: 'Active', color: 'bg-status-doing' },
    { value: 'on_hold', label: 'On Hold', color: 'bg-status-in-review' },
    { value: 'completed', label: 'Completed', color: 'bg-status-done' },
    { value: 'canceled', label: 'Canceled', color: 'bg-status-canceled' },
  ];

  const epicStatusOptions = [
    { value: 'backlog', label: 'Backlog', color: 'bg-status-todo' },
    { value: 'active', label: 'Active', color: 'bg-status-doing' },
    { value: 'on_hold', label: 'On Hold', color: 'bg-status-in-review' },
    { value: 'completed', label: 'Completed', color: 'bg-status-done' },
    { value: 'canceled', label: 'Canceled', color: 'bg-status-canceled' },
  ];

  const issueStatusOptions = [
    { value: 'backlog', label: 'Backlog', color: 'bg-status-todo' },
    { value: 'todo', label: 'Todo', color: 'bg-status-todo' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-status-doing' },
    { value: 'in_review', label: 'In Review', color: 'bg-status-in-review' },
    { value: 'done', label: 'Done', color: 'bg-status-done' },
    { value: 'canceled', label: 'Canceled', color: 'bg-status-canceled' },
    // Note: 'blocked' is computed, not a stored status
  ];

  const statusOptions = $derived(
    node.type === 'project'
      ? projectStatusOptions
      : node.type === 'epic'
        ? epicStatusOptions
        : issueStatusOptions,
  );

  const currentOption = $derived(statusOptions.find((o) => o.value === status));
</script>

<!-- Display Mode: Dot + Label -->
<div class="flex items-center gap-2">
  <div class="w-2 h-2 md:w-3 md:h-3 rounded-full {currentOption?.color || 'bg-gray-400'}"></div>
  <span class="text-foreground {compact ? 'text-xs' : ''}">{currentOption?.label || status}</span>
</div>
