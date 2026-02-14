<script lang="ts">
  /**
   * Projects List Page
   *
   * Shows all user's projects in a grid layout with create/edit/archive actions
   * Supports drill-down navigation: click project → expand inline to show epics
   */

  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import ProjectCard from '$lib/components/ProjectCard.svelte';
  import ProjectSheet from '$lib/components/ProjectSheet.svelte';
  import ExpandedProjectView from '$lib/components/ExpandedProjectView.svelte';
  import { Button } from '$lib/components/ui/button';
  import type { PageData } from './$types';
  import type { Project } from '$lib/types';

  let { data }: { data: PageData } = $props();

  // URL-based state for expanded project and epic (enables deep-linking)
  let expandedProjectId = $derived($page.url.searchParams.get('project') || null);
  let expandedEpicId = $derived($page.url.searchParams.get('epic') || null);

  // Component-local state for expanded issues (no persistence needed)
  let expandedIssueIds = $state<Set<string>>(new Set());

  function toggleProject(projectId: string) {
    const url = new URL($page.url);
    if (expandedProjectId === projectId) {
      // Collapse: clear all expansions
      url.searchParams.delete('project');
      url.searchParams.delete('epic');
      expandedIssueIds = new Set();
    } else {
      // Expand/switch: set project, clear epic and issues
      url.searchParams.set('project', projectId);
      url.searchParams.delete('epic');
      expandedIssueIds = new Set();
    }
    goto(url, { replaceState: true, noScroll: true });
  }

  function toggleEpic(epicId: string) {
    const url = new URL($page.url);
    if (expandedEpicId === epicId) {
      // Collapse epic: clear epic and issues
      url.searchParams.delete('epic');
      expandedIssueIds = new Set();
    } else {
      // Expand/switch epic: set epic, clear issues
      url.searchParams.set('epic', epicId);
      expandedIssueIds = new Set();
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

  // Sheet state management
  let sheetOpen = $state(false);
  let sheetMode: 'create' | 'edit' = $state('create');
  let selectedProject: Project | undefined = $state(undefined);

  // Feedback message state
  let feedbackMessage = $state('');
  let feedbackType: 'success' | 'error' = $state('success');
  let showFeedback = $state(false);

  function openCreateSheet() {
    sheetMode = 'create';
    selectedProject = undefined;
    sheetOpen = true;
  }

  function openEditSheet(project: Project) {
    sheetMode = 'edit';
    selectedProject = project;
    sheetOpen = true;
  }

  function handleArchive(project: Project) {
    if (confirm(`Archive "${project.name}"? It will be hidden from this list.`)) {
      // Form will be submitted via the ProjectCard component
    }
  }

  function showToast(message: string, type: 'success' | 'error') {
    feedbackMessage = message;
    feedbackType = type;
    showFeedback = true;
    setTimeout(() => {
      showFeedback = false;
    }, 3000);
  }

  // Handle form responses with feedback notifications
  $effect(() => {
    const form = $page.form;
    if (form?.success) {
      const messages = {
        create: 'Project created',
        update: 'Project updated',
        archive: 'Project archived',
      };
      const message = messages[form.action as keyof typeof messages] || 'Success';
      showToast(message, 'success');
    } else if (form?.error) {
      showToast(form.error, 'error');
    }
  });
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <h1 class="font-accent text-page-title">Projects</h1>
    <Button onclick={openCreateSheet} class="bg-primary hover:bg-primary-hover text-white">
      New Project
    </Button>
  </div>

  {#if data.projects.length === 0}
    <div class="text-center py-12">
      <p class="text-muted-foreground text-lg">No projects yet. Create your first project.</p>
    </div>
  {:else}
    <!-- Conditional grid columns based on expansion state -->
    <div class="grid gap-4 {expandedProjectId ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-3'}">
      {#each data.projects as project (project.id)}
        <div
          class="transition-all duration-200 {expandedProjectId && expandedProjectId !== project.id
            ? 'opacity-40 scale-95'
            : 'opacity-100 scale-100'}"
        >
          {#if expandedProjectId === project.id}
            <!-- Expanded project view showing epics -->
            <ExpandedProjectView
              {project}
              {expandedEpicId}
              {expandedIssueIds}
              onToggleEpic={toggleEpic}
              onToggleIssue={toggleIssue}
              onClose={() => toggleProject(project.id)}
            />
          {:else}
            <!-- Collapsed project card -->
            <ProjectCard
              {project}
              counts={project.counts}
              onEdit={openEditSheet}
              onArchive={handleArchive}
              onToggle={() => toggleProject(project.id)}
            />
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Project create/edit sheet -->
<ProjectSheet bind:open={sheetOpen} mode={sheetMode} project={selectedProject} />

<!-- Simple toast-style feedback -->
{#if showFeedback}
  <div
    class="fixed bottom-4 right-4 px-4 py-3 rounded-md shadow-lg transition-opacity z-50 {feedbackType ===
    'success'
      ? 'bg-primary text-white'
      : 'bg-destructive text-white'}"
  >
    {feedbackMessage}
  </div>
{/if}
