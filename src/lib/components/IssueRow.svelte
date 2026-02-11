<script lang="ts">
  /**
   * IssueRow Component - North Design System
   *
   * Displays a single issue in a list view.
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
   */

  import type { Issue } from '$lib/types';
  import { Badge } from '$lib/components/ui/badge';

  export let issue: Issue;
  export let onClick: () => void = () => {};

  // TODO: Implement isBlocked() from lib/utils/issue-helpers.ts
  const isBlocked = false;

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
</script>

<!-- North Design: No heavy cards, light divider, minimal hover -->
<button
  onclick={onClick}
  class="w-full text-left px-4 py-4 border-b border-border-divider hover:bg-surface-subtle transition-colors duration-150 group"
>
  <div class="flex items-start justify-between gap-3">
    <!-- Left: Status dot + Content -->
    <div class="flex items-start gap-3 flex-1 min-w-0">
      <!-- Status indicator: small colored dot per North spec -->
      <div class="flex items-center pt-1">
        <div class={`w-1.5 h-1.5 rounded-full ${getStatusColor(issue.status)}`} />
      </div>

      <div class="flex-1 min-w-0">
        <!-- Title: 16px, weight 500 (medium bold-ish) -->
        <h3 class="text-issue-title truncate">{issue.title}</h3>

        <!-- Metadata: 13px, secondary color -->
        <p class="text-metadata mt-1 truncate">
          {issue.project?.name} / {issue.epic?.name}
        </p>
      </div>
    </div>

    <!-- Right: Priority & Blocked indicators -->
    <div class="flex items-center gap-2 shrink-0">
      <!-- Priority Badge: light burnt orange tint per North spec -->
      <Badge variant="default" class="text-xs">P{issue.priority}</Badge>

      <!-- Blocked Indicator: amber dot with text -->
      {#if isBlocked}
        <Badge variant="status-blocked" class="text-xs">Blocked</Badge>
      {/if}
    </div>
  </div>
</button>
