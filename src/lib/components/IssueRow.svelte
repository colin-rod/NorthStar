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
  import PriorityBadge from '$lib/components/PriorityBadge.svelte';
  import DependencyChip from '$lib/components/DependencyChip.svelte';
  import { isBlocked } from '$lib/utils/issue-helpers';
  import GripVertical from '@lucide/svelte/icons/grip-vertical';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import ChevronUp from '@lucide/svelte/icons/chevron-up';
  import CheckCircle2 from '@lucide/svelte/icons/check-circle-2';
  import Lock from '@lucide/svelte/icons/lock';
  import X from '@lucide/svelte/icons/x';
  import { dismissReorderHint, reorderHintDismissed } from '$lib/stores/ui-hints';

  interface Props {
    issue: Issue;
    onClick?: () => void;
    dragDisabled?: boolean;
    hasSubIssues?: boolean;
    subIssueCount?: number;
    doneSubIssueCount?: number;
    isExpanded?: boolean;
    isSubIssue?: boolean;
    onToggleExpand?: (() => void) | null;
    onMoveUp?: (() => void) | null;
    onMoveDown?: (() => void) | null;
    showReorderHint?: boolean;
  }

  let {
    issue,
    onClick = () => {},
    dragDisabled = $bindable(true),
    hasSubIssues = false,
    subIssueCount = 0,
    doneSubIssueCount = 0,
    isExpanded = false,
    isSubIssue = false,
    onToggleExpand = null,
    onMoveUp = null,
    onMoveDown = null,
    showReorderHint = false,
  }: Props = $props();

  // Compute blocked status
  let blocked = $derived(isBlocked(issue));

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

  const formatStatusLabel = (status: string) =>
    status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

  let statusLabel = $derived(formatStatusLabel(issue.status));
</script>

<!-- North Design: No heavy cards, light divider, minimal hover -->
<div
  data-testid="issue-row"
  class="relative w-full flex items-center px-4 py-4 border-b border-border-divider hover:bg-surface-subtle transition-colors duration-150 group {blocked
    ? 'bg-bg-blocked/50 border-l-[3px] border-l-status-blocked'
    : ''}"
>
  <!-- Drag Handle (left side, hover-visible) -->
  <div
    class="absolute left-0 flex items-center justify-center w-8 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 cursor-grab active:cursor-grabbing transition-opacity"
    aria-hidden="true"
    onmousedown={() => {
      dragDisabled = false;
      dismissReorderHint();
    }}
    onmouseup={() => (dragDisabled = true)}
    onmouseleave={() => (dragDisabled = true)}
    ontouchstart={() => {
      dragDisabled = false;
      dismissReorderHint();
    }}
    ontouchend={() => (dragDisabled = true)}
  >
    <GripVertical class="h-4 w-4 text-muted-foreground" />
  </div>

  {#if showReorderHint && !$reorderHintDismissed}
    <div
      class="absolute left-8 top-1/2 -translate-y-1/2 z-10 flex items-center gap-2 rounded-md border border-border-divider bg-surface px-2 py-1 text-xs text-muted-foreground shadow-sm"
      role="status"
      aria-live="polite"
    >
      <span>Tip: Hover and drag to reorder</span>
      <button
        type="button"
        class="rounded p-0.5 hover:bg-surface-subtle"
        aria-label="Dismiss reorder tip"
        onclick={(e) => {
          e.stopPropagation();
          dismissReorderHint();
        }}
      >
        <X class="h-3 w-3" />
      </button>
    </div>
  {/if}

  <!-- Main Content Area (non-interactive container) -->
  <div
    class="flex-1 flex items-start gap-3 min-w-0"
    style={isSubIssue ? 'margin-left: 3rem;' : 'margin-left: 2rem;'}
  >
    <!-- Expand/Collapse Chevron (sibling button for parents with sub-issues) -->
    {#if hasSubIssues}
      <button
        type="button"
        onclick={(e) => {
          e.stopPropagation();
          onToggleExpand?.();
        }}
        class="flex items-center gap-1 shrink-0 pt-1 cursor-pointer"
        aria-label={isExpanded ? 'Collapse sub-issues' : 'Expand sub-issues'}
      >
        {#if isExpanded}
          <ChevronDown class="h-4 w-4 text-muted-foreground" />
        {:else}
          <ChevronRight class="h-4 w-4 text-muted-foreground" />
        {/if}
        <Badge variant="outline" class="text-xs">{doneSubIssueCount}/{subIssueCount}</Badge>
      </button>
    {:else}
      <!-- Spacer for alignment when no chevron -->
      <div class="w-4 shrink-0"></div>
    {/if}

    <!-- Clickable Content Area (sibling button) -->
    <button type="button" onclick={onClick} class="flex-1 text-left flex items-start gap-3 min-w-0">
      <!-- Status indicator: small colored dot per North spec -->
      <div class="flex items-center gap-1 pt-1 shrink-0">
        <div
          class={`w-2 h-2 md:w-3 md:h-3 rounded-full ${getStatusColor(issue.status)}`}
          aria-hidden="true"
        ></div>
        <span class="sr-only">{statusLabel}</span>
        {#if blocked}
          <Lock class="h-4 w-4 text-status-blocked-strong" />
        {/if}
      </div>

      <!-- Priority Badge: positioned left for scanability -->
      <div class="flex items-center pt-0.5 shrink-0">
        <PriorityBadge priority={issue.priority} />
      </div>

      <div class="flex-1 min-w-0">
        <!-- Title: 16px, weight 500 (medium bold-ish) -->
        <h3 class="text-issue-title truncate flex items-center gap-2">
          <span class="text-muted-foreground font-mono text-sm">I-{issue.number}</span>
          <span class="mx-1 text-muted-foreground">·</span>
          <span class="flex-1 truncate">{issue.title}</span>
          <!-- Ready indicator: green checkmark for todo status when not blocked -->
          {#if issue.status === 'todo' && !blocked}
            <CheckCircle2 class="h-4 w-4 text-status-done shrink-0" />
          {/if}
        </h3>

        <!-- Metadata: 13px, secondary color -->
        <p class="text-metadata mt-1 truncate">
          {issue.project?.name} / {issue.epic?.name}
        </p>

        <!-- Inline dependency chip with popover -->
        <div class="mt-1">
          <DependencyChip {issue} />
        </div>
      </div>
    </button>
  </div>

  <!-- Right side: Priority & Blocked indicators + Move buttons -->
  <div class="flex items-center gap-2 shrink-0">
    <!-- Move Up/Down Buttons (hover-visible) -->
    <div
      class="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity"
    >
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
