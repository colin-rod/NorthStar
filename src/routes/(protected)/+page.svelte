<script lang="ts">
  /**
   * Home Page
   *
   * Primary view showing "Ready" issues (displayed as "Todo" tab).
   *
   * Requirements from CLAUDE.md:
   * - Segmented filters: Todo, In Progress, Blocked, Done
   * - Each row: title, project/epic, priority, blocked indicator
   */

  import type { PageData } from './$types';
  import { Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/components/ui/tabs';
  import IssueList from '$lib/components/IssueList.svelte';
  import IssueSheet from '$lib/components/IssueSheet.svelte';
  import ProjectFilter from '$lib/components/ProjectFilter.svelte';
  import PriorityFilter from '$lib/components/PriorityFilter.svelte';
  import MilestoneFilter from '$lib/components/MilestoneFilter.svelte';
  import ProgressSummary from '$lib/components/ProgressSummary.svelte';
  import {
    issues,
    selectedIssue,
    isIssueSheetOpen,
    openIssueSheet,
    openCreateIssueSheet,
  } from '$lib/stores/issues';
  import { Button } from '$lib/components/ui/button';
  import { readyIssues, doingIssues, blockedIssues, doneIssues } from '$lib/stores/computed';

  export let data: PageData;

  // Initialize store with loaded data
  $: issues.set(data.issues || []);

  // Progress summary: show milestone name when exactly one milestone is filtered
  $: activeMilestone =
    data.selectedMilestoneIds?.length === 1 && !data.includeNoMilestone
      ? (data.milestones || []).find((m) => m.id === data.selectedMilestoneIds![0])
      : null;
  $: progressTitle = activeMilestone?.name || 'All Issues';
  $: activeMilestoneDueDate = activeMilestone?.due_date || null;
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <h1 class="font-accent text-page-title">Issues</h1>
    <Button onclick={openCreateIssueSheet}>+ New Issue</Button>
  </div>

  <!-- Controls: Filters + Tabs grouped as one control layer -->
  <div class="space-y-3">
    <div class="flex gap-2 flex-wrap">
      <ProjectFilter
        projects={data.projects || []}
        selectedProjectIds={data.selectedProjectIds || []}
      />
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

    <ProgressSummary
      issues={data.issues || []}
      title={progressTitle}
      milestoneDueDate={activeMilestoneDueDate}
    />

    <Tabs defaultValue="ready" class="w-full">
      <TabsList class="grid w-full grid-cols-4">
        <TabsTrigger value="ready">
          Todo ({$readyIssues.length})
        </TabsTrigger>
        <TabsTrigger value="doing">
          In Progress ({$doingIssues.length})
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
          <IssueList issues={$readyIssues} onIssueClick={openIssueSheet} />
        {/if}
      </TabsContent>

      <!-- Doing Tab -->
      <TabsContent value="doing" class="mt-4">
        {#if $doingIssues.length === 0}
          <p class="text-center text-muted-foreground py-8">No issues in progress</p>
        {:else}
          <IssueList issues={$doingIssues} onIssueClick={openIssueSheet} />
        {/if}
      </TabsContent>

      <!-- Blocked Tab -->
      <TabsContent value="blocked" class="mt-4">
        {#if $blockedIssues.length === 0}
          <p class="text-center text-muted-foreground py-8">No blocked issues</p>
        {:else}
          <IssueList issues={$blockedIssues} onIssueClick={openIssueSheet} />
        {/if}
      </TabsContent>

      <!-- Done Tab -->
      <TabsContent value="done" class="mt-4">
        {#if $doneIssues.length === 0}
          <p class="text-center text-muted-foreground py-8">No completed issues</p>
        {:else}
          <IssueList issues={$doneIssues} onIssueClick={openIssueSheet} />
        {/if}
      </TabsContent>
    </Tabs>
  </div>
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
/>

<!-- TODO: Add search/filter functionality -->
<!-- TODO: Add sorting options -->
<!-- TODO: Add bulk actions -->
