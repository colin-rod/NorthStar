<script lang="ts">
  /**
   * Project Detail Page
   *
   * Shows a project with its epics and counts.
   * Supports drill-down navigation: click epic to expand inline.
   *
   * Requirements from CLAUDE.md:
   * - Epics list with counts (Ready, Blocked, Doing, In Review, Done, Canceled)
   * - Drill-down: click epic → expands inline to show issues
   * - Other epics fade/shrink when one is expanded
   */

  import type { PageData } from './$types';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import EpicCard from '$lib/components/EpicCard.svelte';
  import ExpandedEpicView from '$lib/components/ExpandedEpicView.svelte';
  import { Button } from '$lib/components/ui/button';
  import { openIssueSheet } from '$lib/stores/issues';
  import type { Issue } from '$lib/types';

  let { data }: { data: PageData } = $props();

  // URL-based state for expanded epic (enables deep-linking)
  let expandedEpicId = $derived($page.url.searchParams.get('epic') || null);

  // Component-local state for expanded issues (no persistence needed)
  let expandedIssueIds = $state<Set<string>>(new Set());

  function toggleEpic(epicId: string) {
    const url = new URL($page.url);
    if (expandedEpicId === epicId) {
      url.searchParams.delete('epic'); // Collapse
    } else {
      url.searchParams.set('epic', epicId); // Expand/switch
    }
    goto(url, { replaceState: true, noScroll: true });
  }

  function toggleIssue(issueId: string) {
    const newExpanded = new Set(expandedIssueIds);
    if (newExpanded.has(issueId)) {
      newExpanded.delete(issueId);
    } else {
      newExpanded.add(issueId);
    }
    expandedIssueIds = newExpanded;
  }

  function handleIssueClick(issue: Issue) {
    openIssueSheet(issue);
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="font-accent text-page-title">{data.project?.name || 'Project'}</h1>
      <p class="text-muted-foreground">
        {data.epics?.length || 0} epics
      </p>
    </div>
    <Button>New Epic</Button>
  </div>

  <!-- Epics Grid with conditional layout based on expansion state -->
  <div class="grid gap-4 {expandedEpicId ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-3'}">
    {#if data.epics && data.epics.length > 0}
      {#each data.epics as epic (epic.id)}
        <div
          class="transition-all duration-200 {expandedEpicId && expandedEpicId !== epic.id
            ? 'opacity-40 scale-95'
            : 'opacity-100 scale-100'}"
        >
          {#if expandedEpicId === epic.id}
            <!-- Expanded View -->
            <ExpandedEpicView
              {epic}
              allIssues={data.issues || []}
              {expandedIssueIds}
              onToggleIssue={toggleIssue}
              onClose={() => toggleEpic(epic.id)}
              onIssueClick={handleIssueClick}
            />
          {:else}
            <!-- Collapsed Card -->
            <EpicCard
              {epic}
              counts={epic.counts}
              isExpanded={false}
              onToggle={() => toggleEpic(epic.id)}
            />
          {/if}
        </div>
      {/each}
    {:else}
      <p class="col-span-full text-center text-muted-foreground py-8">No epics in this project</p>
    {/if}
  </div>
</div>

<!-- TODO: Add project settings -->
<!-- TODO: Add project statistics -->
<!-- TODO: Add create epic form -->
