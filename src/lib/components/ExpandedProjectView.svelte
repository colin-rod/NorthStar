<script lang="ts">
  import type { Epic, Issue, Project } from '$lib/types';
  import { Button } from '$lib/components/ui/button';
  import EpicCard from '$lib/components/EpicCard.svelte';
  import ExpandedEpicView from '$lib/components/ExpandedEpicView.svelte';
  import { openIssueSheet } from '$lib/stores/issues';
  import X from '@lucide/svelte/icons/x';

  interface Props {
    project: Project & {
      epics?: (Epic & { counts: import('$lib/utils/issue-counts').IssueCounts })[];
      issues?: Issue[];
    };
    expandedEpicId: string | null;
    expandedIssueIds: Set<string>;
    onToggleEpic: (epicId: string) => void;
    onToggleIssue: (issueId: string) => void;
    onClose: () => void;
  }

  let { project, expandedEpicId, expandedIssueIds, onToggleEpic, onToggleIssue, onClose }: Props =
    $props();

  // Filter issues for this project
  let projectIssues = $derived(project.issues || []);

  function handleIssueClick(issue: Issue) {
    openIssueSheet(issue);
  }
</script>

<div class="border rounded-lg p-north-lg bg-surface-base">
  <!-- Header with project name and close button -->
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-section-header">{project.name}</h2>
    <Button variant="ghost" size="icon" onclick={onClose} aria-label="Close">
      <X class="h-4 w-4" />
    </Button>
  </div>

  <!-- Epics grid with conditional layout based on epic expansion -->
  <div class="grid gap-4 {expandedEpicId ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-3'}">
    {#if project.epics && project.epics.length > 0}
      {#each project.epics as epic (epic.id)}
        <div
          class="transition-all duration-200 {expandedEpicId && expandedEpicId !== epic.id
            ? 'opacity-40 scale-95'
            : 'opacity-100 scale-100'}"
        >
          {#if expandedEpicId === epic.id}
            <!-- Expanded epic view (nested) -->
            <ExpandedEpicView
              {epic}
              allIssues={projectIssues}
              {expandedIssueIds}
              {onToggleIssue}
              onClose={() => onToggleEpic(epic.id)}
              onIssueClick={handleIssueClick}
            />
          {:else}
            <!-- Collapsed epic card -->
            <EpicCard {epic} counts={epic.counts} onToggle={() => onToggleEpic(epic.id)} />
          {/if}
        </div>
      {/each}
    {:else}
      <p class="col-span-full text-center text-muted-foreground py-8">No epics in this project</p>
    {/if}
  </div>
</div>
