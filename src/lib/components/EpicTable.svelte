<script lang="ts">
  /**
   * EpicTable Component - North Design System
   *
   * Displays epics in a desktop-optimized table view with inline issue expansion.
   * Used in: Projects view (inline expansion within project rows)
   *
   * North Design Principles:
   * - Clean table headers with subtle text
   * - Light borders, no heavy shadows
   * - Row hover states
   * - Consistent padding (py-4 for rows, py-3 for headers)
   */

  import type { Epic, Issue } from '$lib/types';
  import type { IssueCounts } from '$lib/utils/issue-counts';
  import { computeProgress } from '$lib/utils/issue-counts';
  import EpicRow from '$lib/components/EpicRow.svelte';
  import IssueRow from '$lib/components/IssueRow.svelte';
  import { Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/components/ui/tabs';
  import { isBlocked } from '$lib/utils/issue-helpers';

  interface Props {
    epics: (Epic & { counts: IssueCounts })[];
    allIssues: Issue[];
    expandedEpicId: string | null;
    expandedIssueIds: Set<string>;
    onToggleEpic: (epicId: string) => void;
    onToggleIssue: (issueId: string) => void;
    onOpenEpicSheet: (epic: Epic) => void;
    onOpenIssueSheet: (issue: Issue) => void;
  }

  let {
    epics,
    allIssues,
    expandedEpicId,
    expandedIssueIds,
    onToggleEpic,
    onToggleIssue,
    onOpenEpicSheet,
    onOpenIssueSheet,
  }: Props = $props();

  // Tab state for expanded epic (local, not persisted)
  let activeTab = $state('all');

  // Filter issues for expanded epic
  let epicIssues = $derived(
    expandedEpicId ? allIssues.filter((i) => i.epic_id === expandedEpicId) : [],
  );

  // Compute filtered views (same logic as ExpandedEpicView)
  let todoIssues = $derived(epicIssues.filter((i) => i.status === 'todo' && !isBlocked(i)));
  let doingIssues = $derived(epicIssues.filter((i) => i.status === 'doing'));
  let inReviewIssues = $derived(epicIssues.filter((i) => i.status === 'in_review'));
  let blockedIssues = $derived(epicIssues.filter((i) => isBlocked(i)));
  let doneIssues = $derived(epicIssues.filter((i) => i.status === 'done'));
  let canceledIssues = $derived(epicIssues.filter((i) => i.status === 'canceled'));

  // Visible issues based on tab + expansion state
  let visibleIssues = $derived.by(() => {
    let filtered: Issue[];
    switch (activeTab) {
      case 'todo':
        filtered = todoIssues;
        break;
      case 'doing':
        filtered = doingIssues;
        break;
      case 'in_review':
        filtered = inReviewIssues;
        break;
      case 'blocked':
        filtered = blockedIssues;
        break;
      case 'done':
        filtered = doneIssues;
        break;
      case 'canceled':
        filtered = canceledIssues;
        break;
      default:
        filtered = epicIssues;
    }

    // Filter out sub-issues unless parent is expanded
    return filtered.filter((issue) => {
      if (!issue.parent_issue_id) return true; // Top-level
      return expandedIssueIds.has(issue.parent_issue_id); // Parent expanded
    });
  });

  // Track which issues have sub-issues (for chevron display)
  let issuesWithSubIssues = $derived(
    new Set(epicIssues.filter((i) => i.parent_issue_id).map((i) => i.parent_issue_id!)),
  );

  // Compute sub-issue counts for display
  let subIssueCounts = $derived.by(() => {
    const counts = new Map<string, number>();
    for (const issue of epicIssues) {
      if (issue.parent_issue_id) {
        counts.set(issue.parent_issue_id, (counts.get(issue.parent_issue_id) || 0) + 1);
      }
    }
    return counts;
  });
</script>

{#if epics.length === 0}
  <div class="text-center py-8 text-metadata text-foreground-muted">No epics in this project</div>
{:else}
  <!-- Epics List (no table, just rows) -->
  <div class="border border-border-divider rounded-lg divide-y">
    {#each epics as epic (epic.id)}
      {@const isExpanded = expandedEpicId === epic.id}

      <!-- Epic Row -->
      <EpicRow
        {epic}
        counts={epic.counts}
        {isExpanded}
        onToggle={() => onToggleEpic(epic.id)}
        onOpenSheet={() => onOpenEpicSheet(epic)}
      />

      <!-- Expanded Epic Content (Issues) -->
      {#if isExpanded}
        <div class="bg-surface-subtle px-8 py-4">
          <!-- Tab filters (reuse pattern from ExpandedEpicView) -->
          <Tabs defaultValue={activeTab} class="w-full">
            <TabsList class="mb-4">
              <TabsTrigger value="all" onclick={() => (activeTab = 'all')}
                >All ({epicIssues.length})</TabsTrigger
              >
              <TabsTrigger value="todo" onclick={() => (activeTab = 'todo')}
                >Todo ({todoIssues.length})</TabsTrigger
              >
              <TabsTrigger value="doing" onclick={() => (activeTab = 'doing')}
                >In Progress ({doingIssues.length})</TabsTrigger
              >
              <TabsTrigger value="in_review" onclick={() => (activeTab = 'in_review')}
                >In Review ({inReviewIssues.length})</TabsTrigger
              >
              <TabsTrigger value="blocked" onclick={() => (activeTab = 'blocked')}
                >Blocked ({blockedIssues.length})</TabsTrigger
              >
              <TabsTrigger value="done" onclick={() => (activeTab = 'done')}
                >Done ({doneIssues.length})</TabsTrigger
              >
              <TabsTrigger value="canceled" onclick={() => (activeTab = 'canceled')}
                >Canceled ({canceledIssues.length})</TabsTrigger
              >
            </TabsList>

            <TabsContent value={activeTab}>
              {#if visibleIssues.length === 0}
                <div class="text-center py-8 text-metadata text-foreground-muted">
                  No issues match this filter
                </div>
              {:else}
                <div class="border rounded-lg divide-y">
                  {#each visibleIssues as issue (issue.id)}
                    <IssueRow
                      {issue}
                      onClick={() => onOpenIssueSheet(issue)}
                      hasSubIssues={issuesWithSubIssues.has(issue.id)}
                      subIssueCount={subIssueCounts.get(issue.id) || 0}
                      isExpanded={expandedIssueIds.has(issue.id)}
                      isSubIssue={!!issue.parent_issue_id}
                      onToggleExpand={() => onToggleIssue(issue.id)}
                      dragDisabled={true}
                      onMoveUp={null}
                      onMoveDown={null}
                    />
                  {/each}
                </div>
              {/if}
            </TabsContent>
          </Tabs>
        </div>
      {/if}
    {/each}
  </div>
{/if}
