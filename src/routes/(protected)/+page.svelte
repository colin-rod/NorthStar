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
  import SectionedIssueList from '$lib/components/SectionedIssueList.svelte';
  import IssueSheet from '$lib/components/IssueSheet.svelte';
  import ProjectDetailSheet from '$lib/components/ProjectDetailSheet.svelte';
  import NewButtonDropdown from '$lib/components/NewButtonDropdown.svelte';
  import ProjectFilter from '$lib/components/ProjectFilter.svelte';
  import PriorityFilter from '$lib/components/PriorityFilter.svelte';
  import MilestoneFilter from '$lib/components/MilestoneFilter.svelte';
  import StatusFilter from '$lib/components/StatusFilter.svelte';
  import StoryPointsFilter from '$lib/components/StoryPointsFilter.svelte';
  import GroupBySelector from '$lib/components/GroupBySelector.svelte';
  import SortBySelector from '$lib/components/SortBySelector.svelte';
  import ProgressSummary from '$lib/components/ProgressSummary.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import Inbox from '@lucide/svelte/icons/inbox';
  import SearchX from '@lucide/svelte/icons/search-x';
  import LayoutList from '@lucide/svelte/icons/layout-list';
  import Layers from '@lucide/svelte/icons/layers';
  import { goto } from '$app/navigation';
  import {
    issues,
    selectedIssue,
    isIssueSheetOpen,
    openIssueSheet,
    openCreateIssueSheet,
    projectSheetOpen,
  } from '$lib/stores/issues';
  import { isReady, isBlocked } from '$lib/utils/issue-helpers';

  let { data }: { data: PageData } = $props();

  // Initialize store with loaded data
  $effect(() => {
    issues.set(data.issues || []);
  });

  // Parse URL params from data
  let viewMode = $derived(data.viewMode || 'sectioned');
  let selectedStatuses = $derived(data.selectedStatuses || []);
  let selectedStoryPoints = $derived(data.selectedStoryPoints || []);
  let groupBy = $derived((data.groupBy || 'none') as GroupByMode);
  let sortBy = $derived((data.sortBy || 'priority') as SortByColumn);
  let sortDir = $derived((data.sortDir || 'asc') as SortDirection);

  // Client-side filtering (all issues loaded, filter in browser)
  let filteredIssues = $derived.by((): Issue[] => {
    return $issues.filter((issue) => {
      // Status filter (supports virtual statuses "ready" and "blocked")
      if (selectedStatuses.length > 0) {
        const matchesStatus = selectedStatuses.some((s) => {
          if (s === 'ready') return isReady(issue);
          if (s === 'blocked') return isBlocked(issue);
          return issue.status === s;
        });
        if (!matchesStatus) return false;
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

  // Project sheet state (triggered by NewButtonDropdown)
  let projectDetailSheetOpen = $state(false);

  // Sync store with local state for project sheet
  $effect(() => {
    if ($projectSheetOpen && !projectDetailSheetOpen) {
      projectDetailSheetOpen = true;
    }
  });

  // Sync local state back to store when sheet closes
  $effect(() => {
    if (!projectDetailSheetOpen && $projectSheetOpen) {
      projectSheetOpen.set(false);
    }
  });

  // Detect whether filters are active (for empty state messaging)
  let hasActiveFilters = $derived(
    (data.selectedProjectIds || []).length > 0 ||
      (data.selectedPriorities || []).length > 0 ||
      (data.selectedMilestoneIds || []).length > 0 ||
      data.includeNoMilestone ||
      false ||
      selectedStatuses.length > 0 ||
      selectedStoryPoints.length > 0,
  );

  let hasProjects = $derived((data.projects || []).length > 0);
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <h1 class="font-accent text-page-title">Issues</h1>
    <div class="flex items-center gap-2">
      <button
        type="button"
        title={viewMode === 'sectioned' ? 'View all issues' : 'View by status'}
        onclick={() =>
          goto(viewMode === 'sectioned' ? '?view=all' : '/', {
            replaceState: false,
            noScroll: true,
          })}
        class="flex h-8 w-8 items-center justify-center rounded-md text-foreground-muted hover:bg-surface-subtle hover:text-foreground transition-colors"
      >
        {#if viewMode === 'sectioned'}
          <LayoutList class="h-4 w-4" />
        {:else}
          <Layers class="h-4 w-4" />
        {/if}
      </button>
      <NewButtonDropdown />
    </div>
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

  {#if viewMode === 'all'}
    <!-- Group By + Sort Controls (flat list mode only) -->
    <div class="flex gap-2 items-center">
      <GroupBySelector selected={groupBy} />
      <SortBySelector selected={sortBy} direction={sortDir} />
    </div>
  {/if}

  <!-- Issue List or Grouped List or Sectioned List -->
  {#if viewMode === 'sectioned'}
    {#if $issues.length === 0}
      {#if hasProjects}
        <EmptyState
          icon={Inbox}
          title="No issues yet"
          description="Add your first issue to start tracking work"
          ctaLabel="New Issue"
          onCtaClick={openCreateIssueSheet}
        />
      {:else}
        <EmptyState
          icon={Inbox}
          title="No issues yet"
          description="Create a project to start tracking your work"
          ctaLabel="New Project"
          onCtaClick={() => projectSheetOpen.set(true)}
        />
      {/if}
    {:else}
      <SectionedIssueList issues={filteredIssues} onIssueClick={openIssueSheet} />
    {/if}
  {:else if groupBy === 'none'}
    {#if sortedIssues.length === 0}
      {#if hasActiveFilters}
        <EmptyState
          icon={SearchX}
          title="No issues match"
          description="Try adjusting your filters to see more results"
          ctaLabel="Clear filters"
          onCtaClick={() => goto('/', { replaceState: false, noScroll: true })}
        />
      {:else if hasProjects}
        <EmptyState
          icon={Inbox}
          title="No issues yet"
          description="Add your first issue to start tracking work"
          ctaLabel="New Issue"
          onCtaClick={openCreateIssueSheet}
        />
      {:else}
        <EmptyState
          icon={Inbox}
          title="No issues yet"
          description="Create a project to start tracking your work"
          ctaLabel="New Project"
          onCtaClick={() => projectSheetOpen.set(true)}
        />
      {/if}
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

<!-- Project Detail Sheet (for creation from home page) -->
<ProjectDetailSheet
  bind:open={projectDetailSheetOpen}
  mode="create"
  project={null}
  counts={null}
  metrics={null}
  epics={[]}
  userId={data.session?.user?.id ?? ''}
/>
