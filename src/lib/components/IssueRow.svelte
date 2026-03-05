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
  import PriorityBadge from '$lib/components/PriorityBadge.svelte';
  import DependencyChip from '$lib/components/DependencyChip.svelte';
  import { isBlocked } from '$lib/utils/issue-helpers';
  import { getStatusDotClass, formatStatus } from '$lib/utils/design-tokens';
  import { getProjectColor } from '$lib/utils/project-colors';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import ChevronUp from '@lucide/svelte/icons/chevron-up';
  import CheckCircle2 from '@lucide/svelte/icons/check-circle-2';
  import Lock from '@lucide/svelte/icons/lock';

  interface Props {
    issue: Issue;
    onClick?: () => void;
    onMoveUp?: (() => void) | null;
    onMoveDown?: (() => void) | null;
  }

  let { issue, onClick = () => {}, onMoveUp = null, onMoveDown = null }: Props = $props();

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
  <!-- Main Content Area (non-interactive container) -->
  <div class="flex-1 flex items-start gap-3 min-w-0">
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
