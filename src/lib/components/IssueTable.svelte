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
  import { isBlocked } from '$lib/utils/issue-helpers';
  import ChevronUp from '@lucide/svelte/icons/chevron-up';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';

  interface Props {
    issues: Issue[];
    onRowClick: (issue: Issue) => void;
  }

  let { issues, onRowClick }: Props = $props();

  // Sorting state
  type SortColumn = 'status' | 'title' | 'priority' | 'epic' | 'milestone' | 'story_points';
  let sortColumn = $state<SortColumn>('priority');
  let sortDirection = $state<'asc' | 'desc'>('asc');

  // Sort issues based on current sort state
  let sortedIssues = $derived.by(() => {
    const sorted = [...issues].sort((a, b) => {
      let comparison = 0;

      switch (sortColumn) {
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'priority':
          comparison = a.priority - b.priority;
          break;
        case 'epic':
          comparison = (a.epic?.name || '').localeCompare(b.epic?.name || '');
          break;
        case 'milestone':
          comparison = (a.milestone?.name || '').localeCompare(b.milestone?.name || '');
          break;
        case 'story_points':
          comparison = (a.story_points || 0) - (b.story_points || 0);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  });

  // Toggle sort column/direction
  function handleSort(column: SortColumn) {
    if (sortColumn === column) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortColumn = column;
      sortDirection = 'asc';
    }
  }

  // Status color dot mapping
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

  // Format status for display
  function formatStatus(status: IssueStatus): string {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Get status badge variant
  function getStatusVariant(
    status: IssueStatus,
  ):
    | 'secondary'
    | 'default'
    | 'outline'
    | 'destructive'
    | 'status-todo'
    | 'status-doing'
    | 'status-in-review'
    | 'status-done'
    | 'status-blocked'
    | 'status-canceled'
    | undefined {
    const variantMap: Record<IssueStatus, any> = {
      todo: 'status-todo',
      doing: 'status-doing',
      in_review: 'status-in-review',
      done: 'status-done',
      canceled: 'status-canceled',
    };
    return variantMap[status];
  }
</script>

<!-- North Design: Clean table with subtle borders -->
{#if sortedIssues.length === 0}
  <div class="text-center py-12">
    <p class="text-metadata text-foreground-muted">No issues found</p>
  </div>
{:else}
  <div class="border border-border-divider rounded-lg overflow-hidden">
    <table class="w-full" aria-label="Issues list">
      <!-- Table Header -->
      <thead class="bg-surface-subtle border-b border-border-divider">
        <tr>
          <!-- Status Column -->
          <th class="text-left px-3 py-3">
            <button
              onclick={() => handleSort('status')}
              class="flex items-center gap-1 text-metadata uppercase text-foreground-muted hover:text-foreground transition-colors"
            >
              Status
              {#if sortColumn === 'status'}
                {#if sortDirection === 'asc'}
                  <ChevronUp class="h-3 w-3" />
                {:else}
                  <ChevronDown class="h-3 w-3" />
                {/if}
              {/if}
            </button>
          </th>

          <!-- Title Column -->
          <th class="text-left px-3 py-3">
            <button
              onclick={() => handleSort('title')}
              class="flex items-center gap-1 text-metadata uppercase text-foreground-muted hover:text-foreground transition-colors"
            >
              Title
              {#if sortColumn === 'title'}
                {#if sortDirection === 'asc'}
                  <ChevronUp class="h-3 w-3" />
                {:else}
                  <ChevronDown class="h-3 w-3" />
                {/if}
              {/if}
            </button>
          </th>

          <!-- Epic Column -->
          <th class="text-left px-3 py-3">
            <button
              onclick={() => handleSort('epic')}
              class="flex items-center gap-1 text-metadata uppercase text-foreground-muted hover:text-foreground transition-colors"
            >
              Epic
              {#if sortColumn === 'epic'}
                {#if sortDirection === 'asc'}
                  <ChevronUp class="h-3 w-3" />
                {:else}
                  <ChevronDown class="h-3 w-3" />
                {/if}
              {/if}
            </button>
          </th>

          <!-- Priority Column -->
          <th class="text-left px-3 py-3">
            <button
              onclick={() => handleSort('priority')}
              class="flex items-center gap-1 text-metadata uppercase text-foreground-muted hover:text-foreground transition-colors"
            >
              Priority
              {#if sortColumn === 'priority'}
                {#if sortDirection === 'asc'}
                  <ChevronUp class="h-3 w-3" />
                {:else}
                  <ChevronDown class="h-3 w-3" />
                {/if}
              {/if}
            </button>
          </th>

          <!-- Milestone Column -->
          <th class="text-left px-3 py-3">
            <button
              onclick={() => handleSort('milestone')}
              class="flex items-center gap-1 text-metadata uppercase text-foreground-muted hover:text-foreground transition-colors"
            >
              Milestone
              {#if sortColumn === 'milestone'}
                {#if sortDirection === 'asc'}
                  <ChevronUp class="h-3 w-3" />
                {:else}
                  <ChevronDown class="h-3 w-3" />
                {/if}
              {/if}
            </button>
          </th>

          <!-- Story Points Column -->
          <th class="text-left px-3 py-3">
            <button
              onclick={() => handleSort('story_points')}
              class="flex items-center gap-1 text-metadata uppercase text-foreground-muted hover:text-foreground transition-colors"
            >
              Story Points
              {#if sortColumn === 'story_points'}
                {#if sortDirection === 'asc'}
                  <ChevronUp class="h-3 w-3" />
                {:else}
                  <ChevronDown class="h-3 w-3" />
                {/if}
              {/if}
            </button>
          </th>

          <!-- Blocked Column (not sortable) -->
          <th class="text-left px-3 py-3">
            <span class="text-metadata uppercase text-foreground-muted"> Blocked </span>
          </th>
        </tr>
      </thead>

      <!-- Table Body -->
      <tbody class="divide-y divide-border-divider">
        {#each sortedIssues as issue (issue.id)}
          {@const blocked = isBlocked(issue)}
          <tr
            onclick={() => onRowClick(issue)}
            class="hover:bg-surface-subtle transition-colors cursor-pointer"
          >
            <!-- Status Cell -->
            <td class="px-3 py-4">
              <div class="flex items-center gap-2">
                <div class={`w-1.5 h-1.5 rounded-full ${getStatusColor(issue.status)}`}></div>
                <span class="text-metadata">{formatStatus(issue.status)}</span>
              </div>
            </td>

            <!-- Title Cell -->
            <td class="px-3 py-4">
              <span class="text-body truncate block max-w-md">{issue.title}</span>
            </td>

            <!-- Epic Cell -->
            <td class="px-3 py-4">
              <span class="text-metadata text-foreground-muted truncate block max-w-xs">
                {issue.project?.name} / {issue.epic?.name}
              </span>
            </td>

            <!-- Priority Cell -->
            <td class="px-3 py-4">
              <Badge variant="default" class="text-xs">P{issue.priority}</Badge>
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
                <Badge variant="secondary" class="text-xs">{issue.story_points}</Badge>
              {:else}
                <span class="text-metadata text-foreground-muted">—</span>
              {/if}
            </td>

            <!-- Blocked Cell -->
            <td class="px-3 py-4">
              {#if blocked}
                <Badge variant="status-blocked" class="text-xs">Blocked</Badge>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
