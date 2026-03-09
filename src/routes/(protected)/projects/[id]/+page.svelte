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
  import { goto, invalidateAll } from '$app/navigation';
  import EpicCard from '$lib/components/EpicCard.svelte';
  import ExpandedEpicView from '$lib/components/ExpandedEpicView.svelte';
  import IssueSheet from '$lib/components/IssueSheet.svelte';
  import ProjectDetailSheet from '$lib/components/ProjectDetailSheet.svelte';
  import { Button } from '$lib/components/ui/button';
  import { openIssueSheet, isIssueSheetOpen, selectedIssue } from '$lib/stores/issues';
  import type { Issue } from '$lib/types';
  import { Badge } from '$lib/components/ui/badge';
  import { computeIssueCounts } from '$lib/utils/issue-counts';
  import { computeProjectMetrics } from '$lib/utils/project-helpers';
  import SettingsIcon from '@lucide/svelte/icons/settings';

  let { data }: { data: PageData } = $props();

  // URL-based state for expanded epic (enables deep-linking)
  let expandedEpicId = $derived($page.url.searchParams.get('epic') || null);

  // Component-local state for expanded issues (no persistence needed)
  let expandedIssueIds = $state<Set<string>>(new Set());

  let doneEpics = $derived(
    (data.epics || []).filter((e) => e.status === 'completed' || e.status === 'canceled').length,
  );

  // Project settings sheet state
  let projectSheetOpen = $state(false);

  // Create epic inline form state
  let showNewEpicForm = $state(false);
  let newEpicName = $state('');
  let newEpicLoading = $state(false);

  // Computed counts and metrics for ProjectDetailSheet
  let projectCounts = $derived(computeIssueCounts(data.issues || []));
  let projectMetrics = $derived(computeProjectMetrics(data.issues || []));

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

  function handleNewEpicKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      showNewEpicForm = false;
      newEpicName = '';
    }
  }

  async function handleNewEpicSubmit(e: Event) {
    e.preventDefault();
    if (!newEpicName.trim()) return;

    newEpicLoading = true;
    const formData = new FormData();
    formData.append('name', newEpicName.trim());

    try {
      const response = await fetch('?/createEpic', { method: 'POST', body: formData });
      if (response.ok) {
        await invalidateAll();
        showNewEpicForm = false;
        newEpicName = '';
      }
    } finally {
      newEpicLoading = false;
    }
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="font-accent text-page-title">{data.project?.name || 'Project'}</h1>
      <div class="flex items-center gap-2 mt-1">
        <p class="text-muted-foreground">{data.epics?.length || 0} epics</p>
        <Badge variant="outline" class="text-xs">{doneEpics}/{data.epics?.length || 0}</Badge>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onclick={() => (projectSheetOpen = true)}
        aria-label="Project settings"
      >
        <SettingsIcon class="size-4" />
      </Button>
      <Button
        onclick={() => {
          showNewEpicForm = true;
          newEpicName = '';
        }}>New Epic</Button
      >
    </div>
  </div>

  <!-- Inline create epic form -->
  {#if showNewEpicForm}
    <form onsubmit={handleNewEpicSubmit} class="border rounded-md p-4 bg-surface-subtle">
      <div class="flex gap-2">
        <div class="flex-1">
          <label for="new-epic-name" class="sr-only">Epic name</label>
          <!-- svelte-ignore a11y_autofocus -->
          <input
            id="new-epic-name"
            autofocus
            bind:value={newEpicName}
            placeholder="Epic name..."
            required
            maxlength={100}
            disabled={newEpicLoading}
            onkeydown={handleNewEpicKeydown}
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          />
        </div>
        <Button type="submit" disabled={newEpicLoading || !newEpicName.trim()} size="sm">
          {newEpicLoading ? 'Creating...' : 'Create'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onclick={() => {
            showNewEpicForm = false;
            newEpicName = '';
          }}
          disabled={newEpicLoading}
          size="sm"
        >
          Cancel
        </Button>
      </div>
      <p class="text-xs text-foreground-muted mt-2">Press Escape to cancel, Enter to create</p>
    </form>
  {/if}

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

<!-- Issue Detail Sheet -->
<IssueSheet
  bind:open={$isIssueSheetOpen}
  mode={$selectedIssue ? 'edit' : 'create'}
  issue={$selectedIssue}
  epics={data.epics || []}
  milestones={[]}
  projectIssues={data.issues || []}
  projects={[data.project]}
/>

<!-- Project Settings Sheet (settings + statistics) -->
<ProjectDetailSheet
  bind:open={projectSheetOpen}
  mode="edit"
  project={data.project}
  counts={projectCounts}
  metrics={projectMetrics}
  epics={data.epics || []}
  userId={data.session?.user?.id ?? ''}
/>
