<script lang="ts">
  import type { Epic, Issue } from '$lib/types';
  import { Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/components/ui/tabs';
  import { Button } from '$lib/components/ui/button';
  import Badge from '$lib/components/ui/badge/badge.svelte';
  import IssueRow from '$lib/components/IssueRow.svelte';
  import { isBlocked } from '$lib/utils/issue-helpers';
  import X from '@lucide/svelte/icons/x';

  interface Props {
    epic: Epic;
    allIssues: Issue[];
    expandedIssueIds: Set<string>;
    onToggleIssue: (id: string) => void;
    onClose: () => void;
    onIssueClick: (issue: Issue) => void;
  }

  let { epic, allIssues, expandedIssueIds, onToggleIssue, onClose, onIssueClick }: Props = $props();

  // Filter issues for this epic only
  let epicIssues = $derived(allIssues.filter((i) => i.epic_id === epic.id));

  // Compute filtered views (same logic as epic detail page)
  let todoIssues = $derived(epicIssues.filter((i) => i.status === 'todo' && !isBlocked(i)));
  let doingIssues = $derived(epicIssues.filter((i) => i.status === 'doing'));
  let inReviewIssues = $derived(epicIssues.filter((i) => i.status === 'in_review'));
  let blockedIssues = $derived(epicIssues.filter((i) => isBlocked(i)));
  let doneIssues = $derived(epicIssues.filter((i) => i.status === 'done'));
  let canceledIssues = $derived(epicIssues.filter((i) => i.status === 'canceled'));

  // Tab state (local, not persisted)
  let activeTab = $state('all');

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

<div class="border rounded-lg p-north-lg bg-surface-base">
  <!-- Header with epic name and close button -->
  <div class="flex items-center justify-between mb-4">
    <div class="flex items-center gap-3">
      <h2 class="text-section-header">{epic.name}</h2>
      <Badge variant={epic.status === 'active' ? 'default' : 'secondary'}>
        {epic.status}
      </Badge>
    </div>
    <Button variant="ghost" size="icon" onclick={onClose} aria-label="Close">
      <X class="h-4 w-4" />
    </Button>
  </div>

  <!-- Tab filters (reuse pattern from epic detail page) -->
  <Tabs defaultValue={activeTab} class="w-full">
    <TabsList>
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

    <TabsContent value={activeTab} class="mt-4">
      {#if visibleIssues.length === 0}
        <div class="text-center py-8 text-metadata text-foreground-muted">
          No issues match this filter
        </div>
      {:else}
        <div class="border rounded-lg divide-y">
          {#each visibleIssues as issue (issue.id)}
            <IssueRow
              {issue}
              onClick={() => onIssueClick(issue)}
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
