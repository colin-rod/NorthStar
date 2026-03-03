<script lang="ts">
  /**
   * Epic Detail Page
   *
   * Flat issue list with filters, inline creation, and reordering.
   *
   * Requirements from CLAUDE.md:
   * - Filters: All, Todo, In Progress, In Review, Blocked, Done, Canceled
   * - URL-persisted filter state
   * - Inline "Add issue" functionality
   * - Drag-and-drop + up/down button reordering
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
  import {
    isIssueSheetOpen,
    selectedIssue as selectedIssueStore,
    openIssueSheet,
    openCreateIssueSheet,
  } from '$lib/stores/issues';
  import { isBlocked } from '$lib/utils/issue-helpers';
  import { calculateNewSortOrders, moveIssueUp, moveIssueDown } from '$lib/utils/reorder';
  import { dndzone } from 'svelte-dnd-action';
  import type { Issue } from '$lib/types';
  import { dismissReorderHint } from '$lib/stores/ui-hints';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import Inbox from '@lucide/svelte/icons/inbox';
  import ListTodo from '@lucide/svelte/icons/list-todo';
  import PartyPopper from '@lucide/svelte/icons/party-popper';
  import CircleCheckBig from '@lucide/svelte/icons/circle-check-big';

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
  let readyIssues = $derived(allIssues.filter((i) => i.status === 'todo' && !isBlocked(i)));
  let totalTodoCount = $derived(allIssues.filter((i) => i.status === 'todo').length);
  let doingIssues = $derived(allIssues.filter((i) => i.status === 'in_progress'));
  let inReviewIssues = $derived(allIssues.filter((i) => i.status === 'in_review'));
  let blockedIssues = $derived(allIssues.filter((i) => isBlocked(i)));
  let doneIssues = $derived(allIssues.filter((i) => i.status === 'done'));
  let canceledIssues = $derived(allIssues.filter((i) => i.status === 'canceled'));

  // Get filtered issues based on active tab
  let filteredIssues = $derived.by(() => {
    switch (filter) {
      case 'todo':
        return readyIssues;
      case 'in_progress':
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

  // Note: Using $state instead of $derived because drag-and-drop mutates this
  let visibleIssues = $state<Issue[]>([]);

  // Update visible issues when filters change
  $effect(() => {
    visibleIssues = filteredIssues;
  });

  // Inline form state
  let showInlineForm = $state(false);

  // Drag-and-drop state
  let dragDisabled = $state(true);
  let isReordering = $state(false);

  async function handleDndConsider(e: CustomEvent) {
    dismissReorderHint();
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
        showToast('Failed to reorder issues', 'error');
      }
    } catch (error) {
      console.error('Reorder error:', error);
      showToast('Failed to reorder issues', 'error');
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

  // Note: Using global stores for issue sheet state (isIssueSheetOpen, selectedIssueStore)
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
      <Button
        onclick={() => openCreateIssueSheet()}
        class="bg-primary hover:bg-primary-hover text-white"
      >
        New Issue
      </Button>
    </div>
  </div>

  <!-- Controls: Filters + Tabs grouped as one control layer -->
  <div class="space-y-3">
    <div class="flex gap-2 flex-wrap">
      <PriorityFilter
        selectedPriorities={data.selectedPriorities || []}
        issues={data.issues || []}
      />
      <MilestoneFilter
        milestones={data.milestones || []}
        selectedMilestoneIds={data.selectedMilestoneIds || []}
        includeNoMilestone={data.includeNoMilestone || false}
        issues={data.issues || []}
      />
    </div>

    <Tabs defaultValue={filter} class="w-full">
      <TabsList class="grid w-full grid-cols-7">
        <TabsTrigger value="all" onclick={() => setFilter('all')}
          >All ({allIssues.length})</TabsTrigger
        >
        <TabsTrigger
          value="todo"
          onclick={() => setFilter('todo')}
          title="Todo status with no blockers"
          >Ready ({readyIssues.length}{blockedIssues.length > 0
            ? ` of ${totalTodoCount}`
            : ''})</TabsTrigger
        >
        <TabsTrigger value="in_progress" onclick={() => setFilter('in_progress')}
          >In Progress ({doingIssues.length})</TabsTrigger
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
          {#if filter === 'all' && allIssues.length === 0}
            <EmptyState
              icon={ListTodo}
              title="No issues in this epic"
              description="Add an issue to start tracking work"
              ctaLabel="New Issue"
              onCtaClick={() => (showInlineForm = true)}
            />
          {:else if filter === 'blocked'}
            <EmptyState
              icon={PartyPopper}
              title="Nothing blocked!"
              description="All issues in this epic are flowing smoothly"
              variant="positive"
            />
          {:else if filter === 'done'}
            <EmptyState
              icon={CircleCheckBig}
              title="No completed issues"
              description="Completed issues will appear here"
              variant="subtle"
            />
          {:else}
            <EmptyState
              icon={Inbox}
              title="No {filter === 'in_progress'
                ? 'in progress'
                : filter === 'in_review'
                  ? 'in review'
                  : filter} issues"
              description="Move issues to this status to see them here"
              variant="subtle"
            />
          {/if}
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
                onMoveUp={index > 0 ? () => handleMoveUp(issue.id) : null}
                onMoveDown={index < visibleIssues.length - 1
                  ? () => handleMoveDown(issue.id)
                  : null}
                showReorderHint={index === 0}
              />
            {/each}
          </div>
        {/if}
      </TabsContent>
    </Tabs>
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
</div>

<!-- Issue Detail Sheet -->
<IssueSheet
  bind:open={$isIssueSheetOpen}
  mode={$selectedIssueStore ? 'edit' : 'create'}
  issue={$selectedIssueStore}
  epics={data.epics || []}
  milestones={data.milestones || []}
  projectIssues={data.issues || []}
  projects={[{ id: data.epic?.project_id || '', name: data.epic?.project?.name || '' }]}
  userId={data.session?.user?.id ?? ''}
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
