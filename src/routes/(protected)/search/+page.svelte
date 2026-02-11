<script lang="ts">
  /**
   * Search Page
   *
   * Search issues by title with client-side filtering
   */

  import IssueRow from '$lib/components/IssueRow.svelte';
  import IssueSheet from '$lib/components/IssueSheet.svelte';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Search } from '@lucide/svelte';
  import { openIssueSheet } from '$lib/stores/issues';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let searchQuery = $state('');

  // Client-side filtering
  let filteredIssues = $derived(
    searchQuery.trim()
      ? data.issues.filter((issue) => issue.title.toLowerCase().includes(searchQuery.toLowerCase()))
      : [],
  );

  let resultCount = $derived(filteredIssues.length);
  let showResults = $derived(searchQuery.trim().length > 0);
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-3xl font-bold mb-4">Search Issues</h1>

    <div class="relative">
      <Label for="search-input" class="sr-only">Search issues</Label>
      <div class="relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          id="search-input"
          type="search"
          placeholder="Search for issues by title..."
          value={searchQuery}
          oninput={(e) => (searchQuery = e.currentTarget.value)}
          class="pl-10"
        />
      </div>
    </div>
  </div>

  <div>
    {#if !showResults}
      <div class="text-center py-12">
        <p class="text-muted-foreground text-lg">Search for issues by title</p>
      </div>
    {:else if resultCount === 0}
      <div class="text-center py-12">
        <p class="text-muted-foreground text-lg">No issues match your search</p>
      </div>
    {:else}
      <div>
        <p class="text-sm text-muted-foreground mb-4">
          {resultCount}
          {resultCount === 1 ? 'issue' : 'issues'} found
        </p>
        <div class="border rounded-lg overflow-hidden">
          {#each filteredIssues as issue}
            <IssueRow {issue} onClick={() => openIssueSheet(issue)} />
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- Issue detail sheet -->
<IssueSheet open={false} issue={null} epics={[]} milestones={[]} allIssues={[]} />
