<script lang="ts">
  /**
   * Home Page
   *
   * Primary view showing "Ready" issues.
   *
   * Requirements from CLAUDE.md:
   * - Segmented filters: Ready, Doing, Blocked, Done
   * - Each row: title, project/epic, priority, blocked indicator
   */

  import type { PageData } from './$types';
  import { Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/components/ui/tabs';
  import IssueRow from '$lib/components/IssueRow.svelte';
  import IssueSheet from '$lib/components/IssueSheet.svelte';
  import { issues, selectedIssue, isIssueSheetOpen, openIssueSheet } from '$lib/stores/issues';
  import { readyIssues, doingIssues, blockedIssues, doneIssues } from '$lib/stores/computed';

  export let data: PageData;

  // Initialize store with loaded data
  $: issues.set(data.issues || []);
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <h1 class="text-3xl font-bold">Issues</h1>
    <!-- TODO: Add "New Issue" button -->
  </div>

  <!-- Segmented Filters -->
  <Tabs defaultValue="ready" class="w-full">
    <TabsList class="grid w-full grid-cols-4">
      <TabsTrigger value="ready">
        Ready ({$readyIssues.length})
      </TabsTrigger>
      <TabsTrigger value="doing">
        Doing ({$doingIssues.length})
      </TabsTrigger>
      <TabsTrigger value="blocked">
        Blocked ({$blockedIssues.length})
      </TabsTrigger>
      <TabsTrigger value="done">
        Done ({$doneIssues.length})
      </TabsTrigger>
    </TabsList>

    <!-- Ready Tab -->
    <TabsContent value="ready" class="mt-4">
      {#if $readyIssues.length === 0}
        <p class="text-center text-muted-foreground py-8">No ready issues</p>
      {:else}
        <div class="border rounded-lg divide-y">
          {#each $readyIssues as issue (issue.id)}
            <IssueRow {issue} onClick={() => openIssueSheet(issue)} />
          {/each}
        </div>
      {/if}
    </TabsContent>

    <!-- Doing Tab -->
    <TabsContent value="doing" class="mt-4">
      {#if $doingIssues.length === 0}
        <p class="text-center text-muted-foreground py-8">No issues in progress</p>
      {:else}
        <div class="border rounded-lg divide-y">
          {#each $doingIssues as issue (issue.id)}
            <IssueRow {issue} onClick={() => openIssueSheet(issue)} />
          {/each}
        </div>
      {/if}
    </TabsContent>

    <!-- Blocked Tab -->
    <TabsContent value="blocked" class="mt-4">
      {#if $blockedIssues.length === 0}
        <p class="text-center text-muted-foreground py-8">No blocked issues</p>
      {:else}
        <div class="border rounded-lg divide-y">
          {#each $blockedIssues as issue (issue.id)}
            <IssueRow {issue} onClick={() => openIssueSheet(issue)} />
          {/each}
        </div>
      {/if}
    </TabsContent>

    <!-- Done Tab -->
    <TabsContent value="done" class="mt-4">
      {#if $doneIssues.length === 0}
        <p class="text-center text-muted-foreground py-8">No completed issues</p>
      {:else}
        <div class="border rounded-lg divide-y">
          {#each $doneIssues as issue (issue.id)}
            <IssueRow {issue} onClick={() => openIssueSheet(issue)} />
          {/each}
        </div>
      {/if}
    </TabsContent>
  </Tabs>
</div>

<!-- Issue Detail Sheet -->
<IssueSheet bind:open={$isIssueSheetOpen} issue={$selectedIssue} />

<!-- TODO: Add search/filter functionality -->
<!-- TODO: Add sorting options -->
<!-- TODO: Add bulk actions -->
