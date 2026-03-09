<script lang="ts">
  /**
   * IssueTable Component - North Design System (Desktop)
   *
   * Desktop-optimized table view for issues showing more columns.
   * Used on desktop (≥768px) for better information density.
   *
   * North Design Principles:
   * - Clean table with subtle borders
   * - Header: 13px uppercase, muted color
   * - Rows: 16px vertical padding, hover tint
   * - No heavy styling, minimal chrome
   * - Sortable columns with arrow indicators
   *
   * Columns:
   * - Status (colored dot + label)
   * - Title (truncated, clickable)
   * - Epic (project/epic path)
   * - Priority (P0-P3 badge)
   * - Milestone (name or "—")
   * - Story Points (value or "—")
   * - Blocked indicator (badge if blocked)
   */

  import type { Issue, IssueStatus } from '$lib/types';
  import Badge from '$lib/components/ui/badge/badge.svelte';
  import PriorityBadge from '$lib/components/PriorityBadge.svelte';
  import StoryPointsBadge from '$lib/components/StoryPointsBadge.svelte';
  import { isBlocked } from '$lib/utils/issue-helpers';
  import { getStatusDotClass, formatStatus } from '$lib/utils/design-tokens';
  import Lock from '@lucide/svelte/icons/lock';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import Inbox from '@lucide/svelte/icons/inbox';

  interface Props {
    issues: Issue[];
    onRowClick: (issue: Issue) => void;
  }

  let { issues, onRowClick }: Props = $props();
</script>

<!-- North Design: Clean table with subtle borders -->
{#if issues.length === 0}
  <EmptyState
    icon={Inbox}
    title="No issues found"
    description="Try adjusting your filters"
    variant="subtle"
  />
{:else}
  <div class="border border-border-divider rounded-lg overflow-hidden">
    <table class="w-full" aria-label="Issues list">
      <!-- Table Header -->
      <thead class="bg-surface-subtle border-b border-border-divider">
        <tr>
          <!-- Priority Column (first for scanability) -->
          <th class="text-left px-3 py-3">
            <span class="text-metadata uppercase text-foreground-muted">Priority</span>
          </th>

          <!-- Status Column -->
          <th class="text-left px-3 py-3">
            <span class="text-metadata uppercase text-foreground-muted">Status</span>
          </th>

          <!-- Title Column -->
          <th class="text-left px-3 py-3">
            <span class="text-metadata uppercase text-foreground-muted">Title</span>
          </th>

          <!-- Project Column -->
          <th class="text-left px-3 py-3">
            <span class="text-metadata uppercase text-foreground-muted">Project</span>
          </th>

          <!-- Epic Column -->
          <th class="text-left px-3 py-3">
            <span class="text-metadata uppercase text-foreground-muted">Epic</span>
          </th>

          <!-- Milestone Column -->
          <th class="text-left px-3 py-3">
            <span class="text-metadata uppercase text-foreground-muted">Milestone</span>
          </th>

          <!-- Story Points Column -->
          <th class="text-left px-3 py-3">
            <span class="text-metadata uppercase text-foreground-muted">Story Points</span>
          </th>

          <!-- Blocked Column -->
          <th class="text-left px-3 py-3">
            <span class="text-metadata uppercase text-foreground-muted">Blocked</span>
          </th>
        </tr>
      </thead>

      <!-- Table Body -->
      <tbody class="divide-y divide-border-divider">
        {#each issues as issue (issue.id)}
          {@const blocked = isBlocked(issue)}
          <tr
            onclick={() => onRowClick(issue)}
            class="hover:bg-surface-subtle transition-colors cursor-pointer {blocked
              ? 'bg-bg-blocked/40 border-l-[3px] border-l-status-blocked'
              : ''}"
          >
            <!-- Priority Cell (first for scanability) -->
            <td class="px-3 py-4">
              <PriorityBadge priority={issue.priority} />
            </td>

            <!-- Status Cell -->
            <td class="px-3 py-4">
              <div class="flex items-center gap-2">
                <div
                  class={`w-2 h-2 md:w-3 md:h-3 rounded-full ${getStatusDotClass(issue.status)}`}
                ></div>
                <span class="text-metadata">{formatStatus(issue.status)}</span>
              </div>
            </td>

            <!-- Title Cell -->
            <td class="px-3 py-4">
              <span class="text-body truncate block max-w-md">{issue.title}</span>
            </td>

            <!-- Project Cell -->
            <td class="px-3 py-4">
              <span class="text-metadata text-foreground-muted">
                {issue.project?.name || '—'}
              </span>
            </td>

            <!-- Epic Cell -->
            <td class="px-3 py-4">
              <span class="text-metadata text-foreground-muted truncate block max-w-xs">
                {issue.epic?.name || '—'}
              </span>
            </td>

            <!-- Milestone Cell -->
            <td class="px-3 py-4">
              <span class="text-metadata text-foreground-muted">
                {issue.milestone?.name || '—'}
              </span>
            </td>

            <!-- Story Points Cell -->
            <td class="px-3 py-4">
              {#if issue.story_points}
                <StoryPointsBadge story_points={issue.story_points} />
              {:else}
                <span class="text-metadata text-foreground-muted">—</span>
              {/if}
            </td>

            <!-- Blocked Cell -->
            <td class="px-3 py-4">
              {#if blocked}
                <Badge variant="status-blocked-strong" class="text-xs">
                  <Lock class="h-3 w-3" />
                  Blocked
                </Badge>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
