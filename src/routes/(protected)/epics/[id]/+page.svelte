<script lang="ts">
  /**
   * Epic Detail Page
   *
   * Flat issue list with filters, inline creation, and reordering.
   *
   * Requirements from CLAUDE.md:
   * - Filters: All, Todo, Doing, In Review, Blocked, Done, Canceled
   * - URL-persisted filter state
   * - Inline "Add issue" functionality
   * - Drag-and-drop + up/down button reordering
   * - Sub-issue expand/collapse with global toggle
   */

  import type { PageData } from './$types';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/components/ui/tabs';
  import IssueRow from '$lib/components/IssueRow.svelte';
  import IssueSheet from '$lib/components/IssueSheet.svelte';
  import InlineIssueForm from '$lib/components/InlineIssueForm.svelte';
  import PriorityFilter from '$lib/components/PriorityFilter.svelte';
  import MilestoneFilter from '$lib/components/MilestoneFilter.svelte';
  import { Button } from '$lib/components/ui/button';
  import { openIssueSheet } from '$lib/stores/issues';
  import { isBlocked } from '$lib/utils/issue-helpers';
  import { calculateNewSortOrders, moveIssueUp, moveIssueDown } from '$lib/utils/reorder';
  import { dndzone } from 'svelte-dnd-action';
  import type { Issue } from '$lib/types';

  let { data }: { data: PageData } = $props();

  // URL filter state
  let filter = $derived($page.url.searchParams.get('filter') || 'all');

  function setFilter(newFilter: string) {
    const url = new URL($page.url);
    url.searchParams.set('filter', newFilter);
    goto(url, { replaceState: true, noScroll: true });
  }

  // Issue filtering
  let allIssues = $derived(data.issues || []);
  let todoIssues = $derived(allIssues.filter((i) => i.status === 'todo' && !isBlocked(i)));
  let doingIssues = $derived(allIssues.filter((i) => i.status === 'doing'));
  let inReviewIssues = $derived(allIssues.filter((i) => i.status === 'in_review'));
  let blockedIssues = $derived(allIssues.filter((i) => isBlocked(i)));
  let doneIssues = $derived(allIssues.filter((i) => i.status === 'done'));
  let canceledIssues = $derived(allIssues.filter((i) => i.status === 'canceled'));

  // Get filtered issues based on active tab
  let filteredIssues = $derived.by(() => {
    switch (filter) {
      case 'todo':
        return todoIssues;
      case 'doing':
        return doingIssues;
      case 'in_review':
        return inReviewIssues;
      case 'blocked':
        return blockedIssues;
      case 'done':
        return doneIssues;
      case 'canceled':
        return canceledIssues;
      default:
        return allIssues;
    }
  });

  // Sub-issue visibility state
  let showAllSubIssues = $state(false);
  let expandedParents = $state<Set<string>>(new Set());

  // Filter out sub-issues unless global toggle is on or parent is expanded
  // Note: Using $state instead of $derived because drag-and-drop mutates this
  let visibleIssues = $state<Issue[]>([]);

  // Update visible issues when filters change
  $effect(() => {
    visibleIssues = filteredIssues.filter((issue) => {
      if (!issue.parent_issue_id) return true; // Top-level always shown
      if (showAllSubIssues) return true; // Global toggle
      return expandedParents.has(issue.parent_issue_id); // Parent expanded
    });
  });

  // Track which issues have sub-issues
  let issuesWithSubIssues = $derived(
    new Set(allIssues.filter((i) => i.parent_issue_id).map((i) => i.parent_issue_id!)),
  );

  // Compute sub-issue counts for display
  let subIssueCounts = $derived.by(() => {
    const counts = new Map<string, number>();
    for (const issue of allIssues) {
      if (issue.sub_issues?.length) {
        counts.set(issue.id, issue.sub_issues.length);
      }
    }
    return counts;
  });

  function toggleParent(parentId: string) {
    if (expandedParents.has(parentId)) {
      expandedParents.delete(parentId);
    } else {
      expandedParents.add(parentId);
    }
    expandedParents = new Set(expandedParents); // Trigger reactivity
  }

  // Inline form state
  let showInlineForm = $state(false);

  // Drag-and-drop state
  let dragDisabled = $state(true);
  let isReordering = $state(false);

  async function handleDndConsider(e: CustomEvent) {
    visibleIssues = e.detail.items;
  }

  async function handleDndFinalize(e: CustomEvent) {
    const reorderedIssues = e.detail.items as Issue[];
    visibleIssues = reorderedIssues;

    // Calculate new sort orders
    const updates = calculateNewSortOrders(reorderedIssues);

    if (updates.size > 0) {
      await submitReorder(
        Array.from(updates.entries()).map(([id, sort_order]) => ({ id, sort_order })),
      );
    }
  }

  async function submitReorder(updates: Array<{ id: string; sort_order: number }>) {
    isReordering = true;
    const formData = new FormData();
    formData.append('updates', JSON.stringify(updates));

    try {
      const response = await fetch('?/reorderIssues', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        console.error('Reorder failed:', response);
      }
    } catch (error) {
      console.error('Reorder error:', error);
    } finally {
      isReordering = false;
    }
  }

  async function handleMoveUp(issueId: string) {
    const updates = moveIssueUp(visibleIssues, issueId);
    if (updates.size > 0) {
      // Optimistically update local state
      const updatesMap = new Map(updates);
      visibleIssues = visibleIssues
        .map((issue) => {
          const newSortOrder = updatesMap.get(issue.id);
          return newSortOrder !== undefined ? { ...issue, sort_order: newSortOrder } : issue;
        })
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

      await submitReorder(
        Array.from(updates.entries()).map(([id, sort_order]) => ({ id, sort_order })),
      );
    }
  }

  async function handleMoveDown(issueId: string) {
    const updates = moveIssueDown(visibleIssues, issueId);
    if (updates.size > 0) {
      // Optimistically update local state
      const updatesMap = new Map(updates);
      visibleIssues = visibleIssues
        .map((issue) => {
          const newSortOrder = updatesMap.get(issue.id);
          return newSortOrder !== undefined ? { ...issue, sort_order: newSortOrder } : issue;
        })
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

      await submitReorder(
        Array.from(updates.entries()).map(([id, sort_order]) => ({ id, sort_order })),
      );
    }
  }

  // Success feedback
  let feedbackMessage = $state('');
  let feedbackType: 'success' | 'error' = $state('success');
  let showFeedback = $state(false);

  function showToast(message: string, type: 'success' | 'error') {
    feedbackMessage = message;
    feedbackType = type;
    showFeedback = true;
    setTimeout(() => {
      showFeedback = false;
    }, 3000);
  }

  $effect(() => {
    const form = $page.form;
    if (form?.success) {
      const messages = {
        createIssue: 'Issue created',
        reorderIssues: 'Issues reordered',
      };
      const message = messages[form.action as keyof typeof messages] || 'Success';
      showToast(message, 'success');
    } else if (form?.error) {
      showToast(form.error, 'error');
    }
  });

  // Issue sheet state
  let sheetOpen = $state(false);
  let selectedIssue = $state<Issue | null>(null);
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <div class="flex items-center gap-2">
        <a
          href="/projects/{data.epic?.project_id}"
          class="text-muted-foreground hover:text-foreground"
        >
          ← {data.epic?.project?.name}
        </a>
      </div>
      <h1 class="font-accent text-page-title">{data.epic?.name || 'Epic'}</h1>
      <p class="text-muted-foreground">
        {allIssues.length} issues
      </p>
    </div>
    <div class="flex gap-2">
      <Button onclick={() => (showAllSubIssues = !showAllSubIssues)} variant="outline">
        {showAllSubIssues ? 'Hide Sub-issues' : 'Show All Sub-issues'}
      </Button>
      <Button onclick={() => (showInlineForm = !showInlineForm)}>
        {showInlineForm ? 'Cancel' : 'Add Issue'}
      </Button>
    </div>
  </div>

  <!-- Inline Issue Form -->
  {#if showInlineForm}
    <InlineIssueForm
      epicId={data.epic?.id || ''}
      projectId={data.epic?.project_id || ''}
      onCancel={() => (showInlineForm = false)}
      onSuccess={() => (showInlineForm = false)}
    />
  {/if}

  <!-- Filter controls -->
  <div class="flex gap-2 flex-wrap">
    <PriorityFilter selectedPriorities={data.selectedPriorities || []} issues={data.issues || []} />
    <MilestoneFilter
      milestones={data.milestones || []}
      selectedMilestoneIds={data.selectedMilestoneIds || []}
      includeNoMilestone={data.includeNoMilestone || false}
      issues={data.issues || []}
    />
  </div>

  <!-- Issue Filters -->
  <Tabs defaultValue={filter} class="w-full">
    <TabsList class="grid w-full grid-cols-7">
      <TabsTrigger value="all" onclick={() => setFilter('all')}
        >All ({allIssues.length})</TabsTrigger
      >
      <TabsTrigger value="todo" onclick={() => setFilter('todo')}
        >Todo ({todoIssues.length})</TabsTrigger
      >
      <TabsTrigger value="doing" onclick={() => setFilter('doing')}
        >Doing ({doingIssues.length})</TabsTrigger
      >
      <TabsTrigger value="in_review" onclick={() => setFilter('in_review')}
        >In Review ({inReviewIssues.length})</TabsTrigger
      >
      <TabsTrigger value="blocked" onclick={() => setFilter('blocked')}
        >Blocked ({blockedIssues.length})</TabsTrigger
      >
      <TabsTrigger value="done" onclick={() => setFilter('done')}
        >Done ({doneIssues.length})</TabsTrigger
      >
      <TabsTrigger value="canceled" onclick={() => setFilter('canceled')}
        >Canceled ({canceledIssues.length})</TabsTrigger
      >
    </TabsList>

    <!-- Issue List -->
    <TabsContent value={filter} class="mt-4">
      {#if visibleIssues.length === 0}
        <p class="text-center text-muted-foreground py-8">No issues in this filter</p>
      {:else}
        <div
          class="border rounded-lg divide-y"
          use:dndzone={{
            items: visibleIssues,
            dragDisabled,
            flipDurationMs: 200,
            type: 'issues',
          }}
          onconsider={handleDndConsider}
          onfinalize={handleDndFinalize}
        >
          {#each visibleIssues as issue, index (issue.id)}
            <IssueRow
              {issue}
              bind:dragDisabled
              onClick={() => openIssueSheet(issue)}
              hasSubIssues={issuesWithSubIssues.has(issue.id)}
              subIssueCount={subIssueCounts.get(issue.id) || 0}
              isExpanded={expandedParents.has(issue.id)}
              isSubIssue={!!issue.parent_issue_id}
              onToggleExpand={issuesWithSubIssues.has(issue.id)
                ? () => toggleParent(issue.id)
                : null}
              onMoveUp={index > 0 ? () => handleMoveUp(issue.id) : null}
              onMoveDown={index < visibleIssues.length - 1 ? () => handleMoveDown(issue.id) : null}
            />
          {/each}
        </div>
      {/if}
    </TabsContent>
  </Tabs>
</div>

<!-- Issue Detail Sheet -->
<IssueSheet
  bind:open={sheetOpen}
  issue={selectedIssue}
  epics={data.epics || []}
  milestones={data.milestones || []}
  projectIssues={data.issues || []}
/>

<!-- Toast Feedback -->
{#if showFeedback}
  <div
    class="fixed bottom-4 right-4 px-4 py-3 rounded-md shadow-lg {feedbackType === 'success'
      ? 'bg-primary text-white'
      : 'bg-destructive text-white'}"
  >
    {feedbackMessage}
  </div>
{/if}
