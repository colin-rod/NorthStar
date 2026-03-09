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
  import {
    ISSUE_STATUS_LABELS,
    EPIC_STATUS_LABELS,
    PROJECT_STATUS_LABELS,
  } from '$lib/utils/status-labels';

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
    { value: 'backlog', label: PROJECT_STATUS_LABELS.backlog, color: 'bg-status-todo' },
    { value: 'planned', label: PROJECT_STATUS_LABELS.planned, color: 'bg-status-todo' },
    { value: 'active', label: PROJECT_STATUS_LABELS.active, color: 'bg-status-doing' },
    { value: 'on_hold', label: PROJECT_STATUS_LABELS.on_hold, color: 'bg-status-in-review' },
    { value: 'completed', label: PROJECT_STATUS_LABELS.completed, color: 'bg-status-done' },
    { value: 'canceled', label: PROJECT_STATUS_LABELS.canceled, color: 'bg-status-canceled' },
  ];

  const epicStatusOptions = [
    { value: 'backlog', label: EPIC_STATUS_LABELS.backlog, color: 'bg-status-todo' },
    { value: 'active', label: EPIC_STATUS_LABELS.active, color: 'bg-status-doing' },
    { value: 'on_hold', label: EPIC_STATUS_LABELS.on_hold, color: 'bg-status-in-review' },
    { value: 'completed', label: EPIC_STATUS_LABELS.completed, color: 'bg-status-done' },
    { value: 'canceled', label: EPIC_STATUS_LABELS.canceled, color: 'bg-status-canceled' },
  ];

  const issueStatusOptions = [
    { value: 'backlog', label: ISSUE_STATUS_LABELS.backlog, color: 'bg-status-todo' },
    { value: 'todo', label: ISSUE_STATUS_LABELS.todo, color: 'bg-status-todo' },
    { value: 'in_progress', label: ISSUE_STATUS_LABELS.in_progress, color: 'bg-status-doing' },
    { value: 'in_review', label: ISSUE_STATUS_LABELS.in_review, color: 'bg-status-in-review' },
    { value: 'done', label: ISSUE_STATUS_LABELS.done, color: 'bg-status-done' },
    { value: 'canceled', label: ISSUE_STATUS_LABELS.canceled, color: 'bg-status-canceled' },
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
