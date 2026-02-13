<script lang="ts">
  /**
   * Projects List Page
   *
   * Shows all user's projects in a grid layout with create/edit/archive actions
   */

  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import ProjectCard from '$lib/components/ProjectCard.svelte';
  import ProjectSheet from '$lib/components/ProjectSheet.svelte';
  import { Button } from '$lib/components/ui/button';
  import type { PageData } from './$types';
  import type { Project } from '$lib/types';

  let { data }: { data: PageData } = $props();

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
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {#each data.projects as project}
        <ProjectCard
          {project}
          counts={project.counts}
          onEdit={openEditSheet}
          onArchive={handleArchive}
        />
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
