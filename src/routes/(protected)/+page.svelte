<script lang="ts">
  /**
   * Home Page
   *
   * Enhanced issues view with filtering, sorting, and grouping capabilities.
   */

  import type { PageData } from './$types';
  import type { Issue, GroupByMode, SortByColumn, SortDirection } from '$lib/types';
  import IssueList from '$lib/components/IssueList.svelte';
  import GroupedIssueList from '$lib/components/GroupedIssueList.svelte';
  import IssueSheet from '$lib/components/IssueSheet.svelte';
  import ProjectFilter from '$lib/components/ProjectFilter.svelte';
  import PriorityFilter from '$lib/components/PriorityFilter.svelte';
  import MilestoneFilter from '$lib/components/MilestoneFilter.svelte';
  import StatusFilter from '$lib/components/StatusFilter.svelte';
  import StoryPointsFilter from '$lib/components/StoryPointsFilter.svelte';
  import GroupBySelector from '$lib/components/GroupBySelector.svelte';
  import SortBySelector from '$lib/components/SortBySelector.svelte';
  import ProgressSummary from '$lib/components/ProgressSummary.svelte';
  import {
    issues,
    selectedIssue,
    isIssueSheetOpen,
    openIssueSheet,
    openCreateIssueSheet,
  } from '$lib/stores/issues';
  import { Button } from '$lib/components/ui/button';

  let { data }: { data: PageData } = $props();

  // Initialize store with loaded data
  $effect(() => {
    issues.set(data.issues || []);
  });

  // Parse URL params from data
  let selectedStatuses = $derived(data.selectedStatuses || []);
  let selectedStoryPoints = $derived(data.selectedStoryPoints || []);
  let groupBy = $derived((data.groupBy || 'none') as GroupByMode);
  let sortBy = $derived((data.sortBy || 'priority') as SortByColumn);
  let sortDir = $derived((data.sortDir || 'asc') as SortDirection);

  // Client-side filtering (all issues loaded, filter in browser)
  let filteredIssues = $derived.by((): Issue[] => {
    return $issues.filter((issue) => {
      // Status filter
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(issue.status)) {
        return false;
      }

      // Story points filter
      if (selectedStoryPoints.length > 0) {
        const hasNone = selectedStoryPoints.includes('none');
        const pointValues = selectedStoryPoints.filter((p) => p !== 'none').map(Number);

        if (issue.story_points === null) {
          if (!hasNone) return false;
        } else {
          if (!pointValues.includes(issue.story_points)) return false;
        }
      }

      return true;
    });
  });

  // Client-side sorting
  let sortedIssues = $derived.by((): Issue[] => {
    return [...filteredIssues].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'priority':
          comparison = a.priority - b.priority;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'project':
          comparison = (a.project?.name || '').localeCompare(b.project?.name || '');
          break;
        case 'epic':
          comparison = (a.epic?.name || '').localeCompare(b.epic?.name || '');
          break;
        case 'milestone':
          comparison = (a.milestone?.name || '').localeCompare(b.milestone?.name || '');
          break;
        case 'story_points':
          comparison = (a.story_points || 0) - (b.story_points || 0);
          break;
      }

      return sortDir === 'asc' ? comparison : -comparison;
    });
  });

  // Progress summary: show milestone name when exactly one milestone is filtered
  let activeMilestone = $derived.by(() =>
    data.selectedMilestoneIds?.length === 1 && !data.includeNoMilestone
      ? (data.milestones || []).find((m) => m.id === data.selectedMilestoneIds![0])
      : null,
  );
  let progressTitle = $derived(activeMilestone?.name || 'All Issues');
  let activeMilestoneDueDate = $derived(activeMilestone?.due_date || null);
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <h1 class="font-accent text-page-title">Issues</h1>
    <Button onclick={openCreateIssueSheet}>+ New Issue</Button>
  </div>

  <!-- Filter Row -->
  <div class="flex gap-2 flex-wrap">
    <ProjectFilter
      projects={data.projects || []}
      selectedProjectIds={data.selectedProjectIds || []}
    />
    <PriorityFilter selectedPriorities={data.selectedPriorities || []} issues={data.issues || []} />
    <MilestoneFilter
      milestones={data.milestones || []}
      selectedMilestoneIds={data.selectedMilestoneIds || []}
      includeNoMilestone={data.includeNoMilestone || false}
      issues={data.issues || []}
    />
    <StatusFilter {selectedStatuses} issues={data.issues || []} />
    <StoryPointsFilter {selectedStoryPoints} issues={data.issues || []} />
  </div>

  <!-- Progress Summary -->
  <ProgressSummary
    issues={sortedIssues}
    title={progressTitle}
    milestoneDueDate={activeMilestoneDueDate}
  />

  <!-- Group By + Sort Controls -->
  <div class="flex gap-2 items-center">
    <GroupBySelector selected={groupBy} />
    <SortBySelector selected={sortBy} direction={sortDir} />
  </div>

  <!-- Issue List or Grouped List -->
  {#if groupBy === 'none'}
    {#if sortedIssues.length === 0}
      <p class="text-center text-muted-foreground py-8">No issues found</p>
    {:else}
      <IssueList issues={sortedIssues} onIssueClick={openIssueSheet} />
    {/if}
  {:else}
    <GroupedIssueList issues={sortedIssues} {groupBy} onIssueClick={openIssueSheet} />
  {/if}
</div>

<!-- Issue Detail Sheet -->
<IssueSheet
  bind:open={$isIssueSheetOpen}
  mode={$selectedIssue ? 'edit' : 'create'}
  issue={$selectedIssue}
  epics={data.epics || []}
  milestones={data.milestones || []}
  projectIssues={data.issues || []}
  projects={data.projects || []}
  userId={data.session?.user?.id ?? ''}
/>
