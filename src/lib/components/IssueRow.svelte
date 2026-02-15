<script lang="ts">
  /**
   * IssueRow Component - North Design System
   *
   * Displays a single issue in a list view with reordering and expand/collapse.
   * Used in: Home view, Epic view
   *
   * North Design Principles:
   * - List-first, no heavy cards
   * - Light divider lines, slight hover tint
   * - 16px vertical padding
   * - Title: 16px, weight 500 (medium bold-ish)
   * - Metadata: 13px, secondary color
   * - Priority pill: light burnt orange tint
   * - Status indicator: small colored dot
   *
   * Features:
   * - Drag handle (hover-visible)
   * - Expand/collapse chevron for parents
   * - Up/down buttons for reordering
   * - Sub-issue indentation
   */

  import type { Issue } from '$lib/types';
  import Badge from '$lib/components/ui/badge/badge.svelte';
  import { isBlocked, getBlockingDependencies } from '$lib/utils/issue-helpers';
  import GripVertical from '@lucide/svelte/icons/grip-vertical';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import ChevronUp from '@lucide/svelte/icons/chevron-up';

  interface Props {
    issue: Issue;
    onClick?: () => void;
    dragDisabled?: boolean;
    hasSubIssues?: boolean;
    subIssueCount?: number;
    isExpanded?: boolean;
    isSubIssue?: boolean;
    onToggleExpand?: (() => void) | null;
    onMoveUp?: (() => void) | null;
    onMoveDown?: (() => void) | null;
  }

  let {
    issue,
    onClick = () => {},
    dragDisabled = $bindable(true),
    hasSubIssues = false,
    subIssueCount = 0,
    isExpanded = false,
    isSubIssue = false,
    onToggleExpand = null,
    onMoveUp = null,
    onMoveDown = null,
  }: Props = $props();

  // Compute blocked status
  let blocked = $derived(isBlocked(issue));
  let blockingCount = $derived(getBlockingDependencies(issue).length);

  // Status color dot mapping (4px diameter)
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      todo: 'bg-status-todo',
      doing: 'bg-status-doing',
      in_review: 'bg-status-in-review',
      done: 'bg-status-done',
      blocked: 'bg-status-blocked',
      canceled: 'bg-status-canceled',
    };
    return colors[status] || 'bg-status-todo';
  };


  type PriorityVariant = 'priority-p0' | 'priority-p1' | 'priority-p2' | 'priority-p3';

  function getPriorityVariant(priority: number): PriorityVariant {
    const priorityMap: Record<number, PriorityVariant> = {
      0: 'priority-p0',
      1: 'priority-p1',
      2: 'priority-p2',
      3: 'priority-p3',
    };

    return priorityMap[priority] ?? 'priority-p3';
  }
</script>

<!-- North Design: No heavy cards, light divider, minimal hover -->
<div
  data-testid="issue-row"
  class="relative w-full flex items-center px-4 py-4 border-b border-border-divider hover:bg-surface-subtle transition-colors duration-150 group"
>
  <!-- Drag Handle (left side, hover-visible) -->
  <div
    class="absolute left-0 flex items-center justify-center w-8 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity"
    role="button"
    tabindex="-1"
    aria-label="Drag to reorder"
    onmousedown={() => (dragDisabled = false)}
    onmouseup={() => (dragDisabled = true)}
    onmouseleave={() => (dragDisabled = true)}
    ontouchstart={() => (dragDisabled = false)}
    ontouchend={() => (dragDisabled = true)}
  >
    <GripVertical class="h-4 w-4 text-muted-foreground" />
  </div>

  <!-- Main Content (clickable) -->
  <button
    onclick={onClick}
    class="flex-1 text-left flex items-start gap-3 min-w-0"
    style={isSubIssue ? 'margin-left: 2rem;' : 'margin-left: 2rem;'}
  >
    <!-- Expand/Collapse Chevron (for parents with sub-issues) -->
    {#if hasSubIssues}
      <div
        onclick={(e) => {
          e.stopPropagation();
          onToggleExpand?.();
        }}
        onkeydown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.stopPropagation();
            e.preventDefault();
            onToggleExpand?.();
          }
        }}
        role="button"
        tabindex="0"
        class="flex items-center gap-1 shrink-0 pt-1 cursor-pointer"
        aria-label={isExpanded ? 'Collapse sub-issues' : 'Expand sub-issues'}
      >
        {#if isExpanded}
          <ChevronDown class="h-4 w-4 text-muted-foreground" />
        {:else}
          <ChevronRight class="h-4 w-4 text-muted-foreground" />
        {/if}
        {#if subIssueCount > 0}
          <span class="text-xs text-muted-foreground">({subIssueCount})</span>
        {/if}
      </div>
    {:else}
      <!-- Spacer for alignment when no chevron -->
      <div class="w-4 shrink-0"></div>
    {/if}

    <!-- Status indicator: small colored dot per North spec -->
    <div class="flex items-center pt-1 shrink-0">
      <div class={`w-1.5 h-1.5 rounded-full ${getStatusColor(issue.status)}`}></div>
    </div>

    <div class="flex-1 min-w-0">
      <!-- Title: 16px, weight 500 (medium bold-ish) -->
      <h3 class="text-issue-title truncate">{issue.title}</h3>

      <!-- Metadata: 13px, secondary color -->
      <p class="text-metadata mt-1 truncate">
        {issue.project?.name} / {issue.epic?.name}
      </p>
    </div>
  </button>

  <!-- Right side: Priority & Blocked indicators + Move buttons -->
  <div class="flex items-center gap-2 shrink-0">
    <!-- Priority Badge: light burnt orange tint per North spec -->
    <Badge variant={getPriorityVariant(issue.priority)} class="text-xs">P{issue.priority}</Badge>

    <!-- Blocked Indicator: amber dot with count -->
    {#if blocked}
      <Badge variant="status-blocked" class="text-xs">Blocked ({blockingCount})</Badge>
    {/if}

    <!-- Move Up/Down Buttons (hover-visible) -->
    <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      {#if onMoveUp}
        <button
          onclick={(e) => {
            e.stopPropagation();
            onMoveUp();
          }}
          class="p-1 hover:bg-surface-subtle rounded"
          aria-label="Move up"
        >
          <ChevronUp class="h-4 w-4 text-muted-foreground" />
        </button>
      {/if}
      {#if onMoveDown}
        <button
          onclick={(e) => {
            e.stopPropagation();
            onMoveDown();
          }}
          class="p-1 hover:bg-surface-subtle rounded"
          aria-label="Move down"
        >
          <ChevronDown class="h-4 w-4 text-muted-foreground" />
        </button>
      {/if}
    </div>
  </div>
</div>
