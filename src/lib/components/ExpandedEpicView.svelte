<script lang="ts">
  import type { Epic, Issue } from '$lib/types';
  import { Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/components/ui/tabs';
  import { Button } from '$lib/components/ui/button';
  import Badge from '$lib/components/ui/badge/badge.svelte';
  import IssueRow from '$lib/components/IssueRow.svelte';
  import { bucketIssues } from '$lib/utils/bucket-issues';
  import X from '@lucide/svelte/icons/x';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import ListTodo from '@lucide/svelte/icons/list-todo';
  import Inbox from '@lucide/svelte/icons/inbox';
  import PartyPopper from '@lucide/svelte/icons/party-popper';

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

  let { todoIssues, doingIssues, inReviewIssues, blockedIssues, doneIssues, canceledIssues } =
    $derived(bucketIssues(epicIssues));

  // Tab state (local, not persisted)
  let activeTab = $state('all');

  // Visible issues based on tab + expansion state
  let visibleIssues = $derived.by(() => {
    let filtered: Issue[];
    switch (activeTab) {
      case 'todo':
        filtered = todoIssues;
        break;
      case 'in_progress':
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

    return filtered;
  });
</script>

<div class="border rounded-lg p-north-lg bg-surface-base">
  <!-- Header with epic name and close button -->
  <div class="flex items-center justify-between mb-4">
    <div class="flex items-center gap-3">
      <h2 class="text-section-header font-accent">{epic.name}</h2>
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
      <TabsTrigger value="in_progress" onclick={() => (activeTab = 'in_progress')}
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
        {#if activeTab === 'all' && epicIssues.length === 0}
          <EmptyState
            icon={ListTodo}
            title="No issues in this epic"
            description="Create an issue to start tracking work"
            variant="subtle"
          />
        {:else if activeTab === 'blocked'}
          <EmptyState
            icon={PartyPopper}
            title="Nothing blocked!"
            description="All issues are flowing smoothly"
            variant="positive"
          />
        {:else}
          <EmptyState
            icon={Inbox}
            title="No {activeTab === 'in_progress'
              ? 'in progress'
              : activeTab === 'in_review'
                ? 'in review'
                : activeTab} issues"
            description="Issues will appear here when their status changes"
            variant="subtle"
          />
        {/if}
      {:else}
        <div class="border rounded-lg divide-y">
          {#each visibleIssues as issue (issue.id)}
            <IssueRow
              {issue}
              onClick={() => onIssueClick(issue)}
              onMoveUp={null}
              onMoveDown={null}
            />
          {/each}
        </div>
      {/if}
    </TabsContent>
  </Tabs>
</div>
