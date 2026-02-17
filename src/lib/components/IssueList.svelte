<script lang="ts">
  /**
   * IssueList Component - Adaptive Wrapper
   *
   * Smart wrapper that renders the appropriate issue view based on screen size:
   * - Desktop (≥768px): Table view with more columns
   * - Mobile (<768px): Row-based card list
   *
   * Usage:
   * ```svelte
   * <IssueList {issues} onIssueClick={handleClick} />
   * ```
   */

  import type { Issue } from '$lib/types';
  import { useMediaQuery } from '$lib/hooks/useMediaQuery.svelte';
  import IssueTable from './IssueTable.svelte';
  import IssueRow from './IssueRow.svelte';

  interface Props {
    issues: Issue[];
    onIssueClick: (issue: Issue) => void;
  }

  let { issues, onIssueClick }: Props = $props();

  // Detect desktop breakpoint
  const isDesktop = useMediaQuery('(min-width: 768px)');
</script>

{#if isDesktop()}
  <!-- Desktop: Table view -->
  <IssueTable {issues} onRowClick={onIssueClick} />
{:else}
  <!-- Mobile: Row-based list -->
  <div class="border rounded-lg divide-y">
    {#each issues as issue (issue.id)}
      <IssueRow {issue} onClick={() => onIssueClick(issue)} />
    {/each}
  </div>
{/if}
