<script lang="ts">
  /**
   * ProjectTable Component - North Design System
   *
   * Displays projects in a desktop-optimized table view with sortable columns and drill-down.
   * Used in: Projects list view (desktop ≥768px)
   *
   * North Design Principles:
   * - Clean table headers with subtle text
   * - Light borders, no heavy shadows
   * - Row hover states
   * - Consistent padding (py-4 for rows, py-3 for headers)
   */

  import type { Project, Epic, Issue } from '$lib/types';
  import type { IssueCounts } from '$lib/utils/issue-counts';
  import type { ProjectMetrics } from '$lib/utils/project-helpers';
  import { computeProgress } from '$lib/utils/issue-counts';
  import Badge from '$lib/components/ui/badge/badge.svelte';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import EpicTable from '$lib/components/EpicTable.svelte';

  interface Props {
    projects: (Project & {
      counts: IssueCounts;
      metrics: ProjectMetrics;
      epics: (Epic & { counts: IssueCounts; issues?: Issue[] })[];
      issues: Issue[];
    })[];
    expandedProjectId: string | null;
    expandedEpicId: string | null;
    expandedIssueIds: Set<string>;
    onToggleProject: (projectId: string) => void;
    onToggleEpic: (epicId: string) => void;
    onToggleIssue: (issueId: string) => void;
    onOpenProjectSheet: (project: Project) => void;
    onOpenEpicSheet: (epic: Epic) => void;
    onOpenIssueSheet: (issue: Issue) => void;
  }

  let {
    projects,
    expandedProjectId,
    expandedEpicId,
    expandedIssueIds,
    onToggleProject,
    onToggleEpic,
    onToggleIssue,
    onOpenProjectSheet,
    onOpenEpicSheet,
    onOpenIssueSheet,
  }: Props = $props();
</script>

<!-- North Design: Table with clean borders, minimal styling -->
<div class="border border-border-divider rounded-lg overflow-hidden">
  <table class="w-full">
    <!-- Table Header -->
    <thead class="bg-muted/50">
      <tr class="border-b border-border-divider">
        <th class="text-left py-3 px-4 text-metadata uppercase text-foreground-muted w-12">
          <!-- Chevron column -->
        </th>
        <th class="text-left py-3 px-4 text-metadata uppercase text-foreground-muted"> Project </th>
        <th class="text-left py-3 px-4 text-metadata uppercase text-foreground-muted"> Issues </th>
        <th class="text-left py-3 px-4 text-metadata uppercase text-foreground-muted">
          Active Pts
        </th>
        <th class="text-left py-3 px-4 text-metadata uppercase text-foreground-muted">
          Total Pts
        </th>
        <th class="text-left py-3 px-4 text-metadata uppercase text-foreground-muted"> Ready </th>
        <th class="text-left py-3 px-4 text-metadata uppercase text-foreground-muted"> Doing </th>
        <th class="text-left py-3 px-4 text-metadata uppercase text-foreground-muted min-w-[200px]">
          Progress
        </th>
      </tr>
    </thead>

    <!-- Table Body -->
    <tbody>
      {#each projects as project (project.id)}
        {@const progress = computeProgress(project.counts)}
        {@const isExpanded = expandedProjectId === project.id}
        <tr
          class="border-b border-border-divider hover:bg-surface-subtle transition-colors duration-150 cursor-pointer"
          data-testid="project-table-row"
        >
          <!-- Chevron Column -->
          <td class="py-4 px-4">
            <button
              onclick={(e) => {
                e.stopPropagation();
                onToggleProject(project.id);
              }}
              class="flex items-center cursor-pointer"
              aria-label={isExpanded ? 'Collapse project' : 'Expand project'}
            >
              {#if isExpanded}
                <ChevronDown class="h-5 w-5 text-muted-foreground" />
              {:else}
                <ChevronRight class="h-5 w-5 text-muted-foreground" />
              {/if}
            </button>
          </td>

          <!-- Project Name Column -->
          <td
            class="py-4 px-4"
            onclick={() => onOpenProjectSheet(project)}
            role="button"
            tabindex="0"
          >
            <span class="text-issue-title font-medium truncate">{project.name}</span>
          </td>

          <!-- Total Issues Column -->
          <td
            class="py-4 px-4 text-foreground-secondary"
            onclick={() => onOpenProjectSheet(project)}
          >
            {project.metrics.totalIssues}
          </td>

          <!-- Active Story Points Column -->
          <td
            class="py-4 px-4 text-foreground-secondary"
            onclick={() => onOpenProjectSheet(project)}
          >
            {#if project.metrics.activeStoryPoints > 0}
              <Badge variant="default" class="text-xs">{project.metrics.activeStoryPoints}</Badge>
            {:else}
              <span class="text-muted-foreground">—</span>
            {/if}
          </td>

          <!-- Total Story Points Column -->
          <td
            class="py-4 px-4 text-foreground-secondary"
            onclick={() => onOpenProjectSheet(project)}
          >
            {#if project.metrics.totalStoryPoints > 0}
              <Badge variant="outline" class="text-xs">{project.metrics.totalStoryPoints}</Badge>
            {:else}
              <span class="text-muted-foreground">—</span>
            {/if}
          </td>

          <!-- Ready Count Column -->
          <td class="py-4 px-4" onclick={() => onOpenProjectSheet(project)}>
            <Badge variant="default" class="text-xs">{project.counts.ready}</Badge>
          </td>

          <!-- Doing Count Column -->
          <td class="py-4 px-4" onclick={() => onOpenProjectSheet(project)}>
            <Badge variant="status-doing" class="text-xs">{project.counts.doing}</Badge>
          </td>

          <!-- Progress Bar Column -->
          <td class="py-4 px-4" onclick={() => onOpenProjectSheet(project)}>
            {#if progress.total > 0}
              <div class="flex items-center gap-2">
                <div class="flex-1 h-[3px] bg-muted rounded-full overflow-hidden">
                  <div
                    class="h-full bg-foreground/40 rounded-full transition-all duration-300"
                    style="width: {progress.percentage}%"
                  ></div>
                </div>
                <span class="text-metadata text-foreground-secondary shrink-0 min-w-[3ch]">
                  {progress.percentage}%
                </span>
              </div>
            {:else}
              <span class="text-muted-foreground">0%</span>
            {/if}
          </td>
        </tr>

        <!-- Expanded Project Content (Epics) -->
        {#if isExpanded}
          <tr class="border-0">
            <td colspan="8" class="p-0">
              <div class="bg-surface-subtle px-8 py-4">
                <EpicTable
                  epics={project.epics || []}
                  allIssues={project.issues || []}
                  {expandedEpicId}
                  {expandedIssueIds}
                  {onToggleEpic}
                  {onToggleIssue}
                  {onOpenEpicSheet}
                  {onOpenIssueSheet}
                />
              </div>
            </td>
          </tr>
        {/if}
      {/each}
    </tbody>
  </table>
</div>
