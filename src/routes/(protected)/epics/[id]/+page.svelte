<script lang="ts">
  /**
   * Epic Detail Page
   *
   * Flat issue list with filters.
   *
   * Requirements from CLAUDE.md:
   * - Filters: All, Todo, Doing, In Review, Blocked, Done, Canceled
   * - Inline "Add issue" functionality
   */

  import type { PageData } from './$types';
  import { Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/components/ui/tabs';
  import IssueRow from '$lib/components/IssueRow.svelte';
  import IssueSheet from '$lib/components/IssueSheet.svelte';
  import { Button } from '$lib/components/ui/button';
  import { openIssueSheet } from '$lib/stores/issues';

  export let data: PageData;

  // Filter issues by status
  $: allIssues = data.issues || [];
  $: todoIssues = allIssues.filter((i) => i.status === 'todo');
  $: doingIssues = allIssues.filter((i) => i.status === 'doing');
  $: inReviewIssues = allIssues.filter((i) => i.status === 'in_review');
  $: doneIssues = allIssues.filter((i) => i.status === 'done');
  $: canceledIssues = allIssues.filter((i) => i.status === 'canceled');

  // TODO: Compute blocked issues
  $: blockedIssues = [];

  let sheetOpen = false;
  let selectedIssue = null;
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
      <h1 class="text-3xl font-bold">{data.epic?.name || 'Epic'}</h1>
      <p class="text-muted-foreground">
        {allIssues.length} issues
      </p>
    </div>
    <Button>Add Issue</Button>
  </div>

  <!-- Issue Filters -->
  <Tabs value="all" class="w-full">
    <TabsList class="grid w-full grid-cols-7">
      <TabsTrigger value="all">All ({allIssues.length})</TabsTrigger>
      <TabsTrigger value="todo">Todo ({todoIssues.length})</TabsTrigger>
      <TabsTrigger value="doing">Doing ({doingIssues.length})</TabsTrigger>
      <TabsTrigger value="in_review">In Review ({inReviewIssues.length})</TabsTrigger>
      <TabsTrigger value="blocked">Blocked ({blockedIssues.length})</TabsTrigger>
      <TabsTrigger value="done">Done ({doneIssues.length})</TabsTrigger>
      <TabsTrigger value="canceled">Canceled ({canceledIssues.length})</TabsTrigger>
    </TabsList>

    <!-- All Tab -->
    <TabsContent value="all" class="mt-4">
      {#if allIssues.length === 0}
        <p class="text-center text-muted-foreground py-8">No issues in this epic</p>
      {:else}
        <div class="border rounded-lg divide-y">
          {#each allIssues as issue (issue.id)}
            <IssueRow {issue} onClick={() => openIssueSheet(issue)} />
          {/each}
        </div>
      {/if}
    </TabsContent>

    <!-- Todo Tab -->
    <TabsContent value="todo" class="mt-4">
      {#if todoIssues.length === 0}
        <p class="text-center text-muted-foreground py-8">No todo issues</p>
      {:else}
        <div class="border rounded-lg divide-y">
          {#each todoIssues as issue (issue.id)}
            <IssueRow {issue} onClick={() => openIssueSheet(issue)} />
          {/each}
        </div>
      {/if}
    </TabsContent>

    <!-- Doing Tab -->
    <TabsContent value="doing" class="mt-4">
      {#if doingIssues.length === 0}
        <p class="text-center text-muted-foreground py-8">No issues in progress</p>
      {:else}
        <div class="border rounded-lg divide-y">
          {#each doingIssues as issue (issue.id)}
            <IssueRow {issue} onClick={() => openIssueSheet(issue)} />
          {/each}
        </div>
      {/if}
    </TabsContent>

    <!-- In Review Tab -->
    <TabsContent value="in_review" class="mt-4">
      {#if inReviewIssues.length === 0}
        <p class="text-center text-muted-foreground py-8">No issues in review</p>
      {:else}
        <div class="border rounded-lg divide-y">
          {#each inReviewIssues as issue (issue.id)}
            <IssueRow {issue} onClick={() => openIssueSheet(issue)} />
          {/each}
        </div>
      {/if}
    </TabsContent>

    <!-- Blocked Tab -->
    <TabsContent value="blocked" class="mt-4">
      {#if blockedIssues.length === 0}
        <p class="text-center text-muted-foreground py-8">No blocked issues</p>
      {:else}
        <div class="border rounded-lg divide-y">
          {#each blockedIssues as issue (issue.id)}
            <IssueRow {issue} onClick={() => openIssueSheet(issue)} />
          {/each}
        </div>
      {/if}
    </TabsContent>

    <!-- Done Tab -->
    <TabsContent value="done" class="mt-4">
      {#if doneIssues.length === 0}
        <p class="text-center text-muted-foreground py-8">No completed issues</p>
      {:else}
        <div class="border rounded-lg divide-y">
          {#each doneIssues as issue (issue.id)}
            <IssueRow {issue} onClick={() => openIssueSheet(issue)} />
          {/each}
        </div>
      {/if}
    </TabsContent>

    <!-- Canceled Tab -->
    <TabsContent value="canceled" class="mt-4">
      {#if canceledIssues.length === 0}
        <p class="text-center text-muted-foreground py-8">No canceled issues</p>
      {:else}
        <div class="border rounded-lg divide-y">
          {#each canceledIssues as issue (issue.id)}
            <IssueRow {issue} onClick={() => openIssueSheet(issue)} />
          {/each}
        </div>
      {/if}
    </TabsContent>
  </Tabs>
</div>

<!-- Issue Detail Sheet -->
<IssueSheet bind:open={sheetOpen} issue={selectedIssue} />

<!-- TODO: Implement blocked filter with isBlocked() -->
<!-- TODO: Add create issue form -->
<!-- TODO: Add bulk actions -->
