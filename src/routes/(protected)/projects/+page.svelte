<script lang="ts">
  /**
   * Projects List Page
   *
   * Shows all user's projects in a grid layout with create/edit/archive actions
   * Supports drill-down navigation: click project → expand inline to show epics
   */

  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import ProjectList from '$lib/components/ProjectList.svelte';
  import ProjectSheet from '$lib/components/ProjectSheet.svelte';
  import EpicSheet from '$lib/components/EpicSheet.svelte';
  import IssueSheet from '$lib/components/IssueSheet.svelte';
  import ExpandedProjectView from '$lib/components/ExpandedProjectView.svelte';
  import { Button } from '$lib/components/ui/button';
  import type { PageData } from './$types';
  import type { Project, Epic, Issue } from '$lib/types';
  import { isIssueSheetOpen, selectedIssue, openIssueSheet } from '$lib/stores/issues';

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

  // Sheet state management for projects
  let projectSheetOpen = $state(false);
  let projectSheetMode: 'create' | 'edit' = $state('create');
  let selectedProject: Project | undefined = $state(undefined);

  // Sheet state management for epics
  let epicSheetOpen = $state(false);
  let epicSheetMode: 'create' | 'edit' = $state('create');
  let selectedEpic: Epic | undefined = $state(undefined);
  let epicCreateProjectId: string | undefined = $state(undefined);

  // Feedback message state
  let feedbackMessage = $state('');
  let feedbackType: 'success' | 'error' = $state('success');
  let showFeedback = $state(false);

  function openProjectSheetForCreate() {
    projectSheetMode = 'create';
    selectedProject = undefined;
    projectSheetOpen = true;
  }

  function openProjectSheetForEdit(project: Project) {
    projectSheetMode = 'edit';
    selectedProject = project;
    projectSheetOpen = true;
  }

  function openEpicSheetForCreate(projectId: string) {
    epicSheetMode = 'create';
    selectedEpic = undefined;
    epicCreateProjectId = projectId;
    epicSheetOpen = true;
  }

  function openEpicSheetForEdit(epic: Epic) {
    epicSheetMode = 'edit';
    selectedEpic = epic;
    epicCreateProjectId = undefined;
    epicSheetOpen = true;
  }

  function navigateToProject(projectId: string) {
    goto(`/projects/${projectId}`);
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
    <Button
      onclick={openProjectSheetForCreate}
      class="bg-primary hover:bg-primary-hover text-white"
    >
      New Project
    </Button>
  </div>

  {#if data.projects.length === 0}
    <div class="text-center py-12">
      <p class="text-muted-foreground text-lg">No projects yet. Create your first project.</p>
    </div>
  {:else if expandedProjectId}
    <!-- Expanded project view -->
    {@const expandedProject = data.projects.find((p) => p.id === expandedProjectId)}
    {#if expandedProject}
      <div class="transition-all duration-200">
        <ExpandedProjectView
          project={expandedProject}
          {expandedEpicId}
          {expandedIssueIds}
          onToggleEpic={toggleEpic}
          onToggleIssue={toggleIssue}
          onClose={() => toggleProject(expandedProjectId)}
        />
      </div>
    {/if}
  {:else}
    <!-- List view with inline drill-down -->
    <ProjectList
      projects={data.projects}
      {expandedProjectId}
      {expandedEpicId}
      {expandedIssueIds}
      onToggleProject={toggleProject}
      onToggleEpic={toggleEpic}
      onToggleIssue={toggleIssue}
      onOpenProjectSheet={openProjectSheetForEdit}
      onOpenEpicSheet={openEpicSheetForEdit}
      onOpenIssueSheet={openIssueSheet}
    />
  {/if}
</div>

<!-- Project create/edit sheet -->
<ProjectSheet bind:open={projectSheetOpen} mode={projectSheetMode} project={selectedProject} />

<!-- Epic create/edit sheet -->
<EpicSheet
  bind:open={epicSheetOpen}
  mode={epicSheetMode}
  epic={selectedEpic}
  projectId={epicCreateProjectId}
/>

<!-- Issue sheet (using store) -->
<IssueSheet
  bind:open={$isIssueSheetOpen}
  mode={$selectedIssue ? 'edit' : 'create'}
  issue={$selectedIssue}
  epics={data.projects.flatMap((p) => p.epics || [])}
  milestones={[]}
  projectIssues={data.projects.flatMap((p) => p.issues || [])}
  projects={data.projects}
/>

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
