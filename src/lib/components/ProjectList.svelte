<script lang="ts">
  /**
   * ProjectList Component - Adaptive Wrapper
   *
   * Smart wrapper that renders the appropriate project view based on screen size:
   * - Desktop (≥768px): Table view with multiple columns
   * - Mobile (<768px): Row-based card list
   *
   * Usage:
   * ```svelte
   * <ProjectList
   *   projects={data.projects}
   *   expandedProjectId={expandedProjectId}
   *   onToggleProject={toggleProject}
   *   onNavigateToProject={(id) => goto(`/projects/${id}`)}
   * />
   * ```
   */

  import type { Project, Epic, Issue } from '$lib/types';
  import type { IssueCounts } from '$lib/utils/issue-counts';
  import type { ProjectMetrics } from '$lib/utils/project-helpers';
  import { useMediaQuery } from '$lib/hooks/useMediaQuery.svelte';
  import ProjectTable from './ProjectTable.svelte';
  import ProjectRow from './ProjectRow.svelte';

  interface Props {
    projects: (Project & { counts: IssueCounts; metrics: ProjectMetrics })[];
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

  // Detect desktop breakpoint
  const isDesktop = useMediaQuery('(min-width: 768px)');
</script>

{#if isDesktop()}
  <!-- Desktop: Table view with inline drill-down -->
  <ProjectTable
    {projects}
    {expandedProjectId}
    {expandedEpicId}
    {expandedIssueIds}
    {onToggleProject}
    {onToggleEpic}
    {onToggleIssue}
    {onOpenProjectSheet}
    {onOpenEpicSheet}
    {onOpenIssueSheet}
  />
{:else}
  <!-- Mobile: Row-based list (navigate to detail pages) -->
  <div class="border border-border-divider rounded-lg divide-y">
    {#each projects as project (project.id)}
      <ProjectRow
        {project}
        counts={project.counts}
        metrics={project.metrics}
        isExpanded={expandedProjectId === project.id}
        onToggle={() => onToggleProject(project.id)}
        onNavigate={() => onOpenProjectSheet(project)}
      />
    {/each}
  </div>
{/if}
