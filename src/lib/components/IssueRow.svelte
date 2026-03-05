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
  import { getStatusDotClass, formatStatus } from '$lib/utils/design-tokens';
  import { getProjectColor } from '$lib/utils/project-colors';
  import GripVertical from '@lucide/svelte/icons/grip-vertical';
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
    onMoveUp?: (() => void) | null;
    onMoveDown?: (() => void) | null;
    showReorderHint?: boolean;
  }

  let {
    issue,
    onClick = () => {},
    dragDisabled = $bindable(true),
    onMoveUp = null,
    onMoveDown = null,
    showReorderHint = false,
  }: Props = $props();

  // Compute blocked status
  let blocked = $derived(isBlocked(issue));

  let statusLabel = $derived(formatStatus(issue.status));
  let projectColor = $derived(getProjectColor(issue.project?.color));
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
    role="button"
    tabindex="-1"
    class="absolute left-0 flex items-center justify-center w-8 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 cursor-grab active:cursor-grabbing transition-opacity"
    aria-label="Drag to reorder"
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
    <GripVertical aria-hidden="true" class="h-4 w-4 text-muted-foreground" />
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
        <X aria-hidden="true" class="h-3 w-3" />
      </button>
    </div>
  {/if}

  <!-- Main Content Area (non-interactive container) -->
  <div class="flex-1 flex items-start gap-3 min-w-0 ml-8">
    <!-- Spacer for alignment -->
    <div class="w-4 shrink-0"></div>

    <!-- Clickable Content Area (sibling button) -->
    <button type="button" onclick={onClick} class="flex-1 text-left flex items-start gap-3 min-w-0">
      <!-- Status indicator: small colored dot per North spec -->
      <div class="flex items-center gap-1 pt-1 shrink-0">
        <div
          class={`w-2 h-2 md:w-3 md:h-3 rounded-full ${getStatusDotClass(issue.status)}`}
          aria-hidden="true"
        ></div>
        <span class="sr-only">{statusLabel}</span>
        {#if blocked}
          <Lock aria-hidden="true" class="h-4 w-4 text-status-blocked-strong" />
        {/if}
      </div>

      <!-- Priority Badge: positioned left for scanability -->
      <div class="flex items-center pt-0.5 shrink-0">
        <PriorityBadge priority={issue.priority} />
      </div>

      <div class="flex-1 min-w-0">
        <!-- Title: 16px, weight 500 (medium bold-ish) -->
        <h3 class="text-issue-title truncate flex items-center gap-2">
          <span aria-label="Issue {issue.number}" class="text-muted-foreground font-mono text-sm"
            >I-{issue.number}</span
          >
          <span aria-hidden="true" class="mx-1 text-muted-foreground">·</span>
          <span class="flex-1 truncate">{issue.title}</span>
          <!-- Ready indicator: green checkmark for todo status when not blocked -->
          {#if issue.status === 'todo' && !blocked}
            <CheckCircle2 aria-hidden="true" class="h-4 w-4 text-status-done shrink-0" />
          {/if}
        </h3>

        <!-- Metadata: 13px, secondary color -->
        <p class="text-metadata mt-1 truncate flex items-center gap-1.5">
          <span class="h-2 w-2 rounded-sm shrink-0 {projectColor.bg}"></span>
          <span>{issue.project?.name} / {issue.epic?.name}</span>
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
          <ChevronUp aria-hidden="true" class="h-4 w-4 text-muted-foreground" />
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
          <ChevronDown aria-hidden="true" class="h-4 w-4 text-muted-foreground" />
        </button>
      {/if}
    </div>
  </div>
</div>
