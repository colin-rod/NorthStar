<!-- src/lib/components/FilterPanel.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { Button } from '$lib/components/ui/button';
  import ProjectStatusFilter from '$lib/components/ProjectStatusFilter.svelte';
  import EpicStatusFilter from '$lib/components/EpicStatusFilter.svelte';
  import PriorityFilter from '$lib/components/PriorityFilter.svelte';
  import StatusFilter from '$lib/components/StatusFilter.svelte';
  import StoryPointsFilter from '$lib/components/StoryPointsFilter.svelte';
  import type { TreeFilterParams } from '$lib/utils/tree-filter-params';

  interface Props {
    filterParams: TreeFilterParams;
    open: boolean;
  }

  let { filterParams, open }: Props = $props();

  function clearAllFilters() {
    const params = new URLSearchParams($page.url.searchParams);

    // Remove all filter params
    params.delete('project_status');
    params.delete('epic_status');
    params.delete('priority');
    params.delete('status');
    params.delete('story_points');

    // Keep grouping and sorting
    const newUrl = `${$page.url.pathname}?${params.toString()}`;
    goto(newUrl, { replaceState: false, noScroll: true });
  }
</script>

{#if open}
  <div class="border rounded-lg p-4 space-y-4 bg-muted/20">
    <!-- Project Filters -->
    <div>
      <h3 class="text-sm font-medium mb-2">Project Filters</h3>
      <div class="flex gap-2 flex-wrap">
        <ProjectStatusFilter selectedStatuses={filterParams.projectStatus} />
      </div>
    </div>

    <!-- Epic Filters -->
    <div>
      <h3 class="text-sm font-medium mb-2">Epic Filters</h3>
      <div class="flex gap-2 flex-wrap">
        <EpicStatusFilter selectedStatuses={filterParams.epicStatus} />
      </div>
    </div>

    <!-- Issue Filters -->
    <div>
      <h3 class="text-sm font-medium mb-2">Issue Filters</h3>
      <div class="flex gap-2 flex-wrap">
        <PriorityFilter selectedPriorities={filterParams.issuePriority} issues={[]} />
        <StatusFilter selectedStatuses={filterParams.issueStatus} issues={[]} />
        <StoryPointsFilter
          selectedStoryPoints={filterParams.issueStoryPoints.map((sp) =>
            sp === null ? 'none' : sp.toString(),
          )}
          issues={[]}
        />
      </div>
    </div>

    <!-- Clear Filters -->
    <div class="flex justify-end">
      <Button variant="ghost" size="sm" onclick={clearAllFilters}>Clear all filters</Button>
    </div>
  </div>
{/if}
