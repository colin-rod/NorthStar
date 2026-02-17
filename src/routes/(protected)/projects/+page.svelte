<script lang="ts">
  /**
   * Projects List Page - Tree Grid View
   *
   * Displays all projects with unified tree grid:
   * Projects → Epics → Issues → Sub-issues
   */

  import { page } from '$app/stores';
  import { goto, invalidateAll } from '$app/navigation';
  import TreeGrid from '$lib/components/tree-grid/TreeGrid.svelte';
  import ProjectSheet from '$lib/components/ProjectSheet.svelte';
  import EpicSheet from '$lib/components/EpicSheet.svelte';
  import IssueSheet from '$lib/components/IssueSheet.svelte';
  import { Button } from '$lib/components/ui/button';
  import type { PageData } from './$types';
  import type { Project, Epic, Issue } from '$lib/types';
  import { isIssueSheetOpen, selectedIssue, openIssueSheet } from '$lib/stores/issues';

  let { data }: { data: PageData } = $props();

  // URL-based state for expanded items (enables deep-linking)
  let expandedProjectId = $derived($page.url.searchParams.get('project') || null);
  let expandedEpicId = $derived($page.url.searchParams.get('epic') || null);

  // Build expandedIds set from URL params
  let expandedIds = $derived.by(() => {
    const ids = new Set<string>();
    if (expandedProjectId) ids.add(expandedProjectId);
    if (expandedEpicId) ids.add(expandedEpicId);
    // TODO: Add issue expansion from URL if needed
    return ids;
  });

  // Component-local state
  let selectedIds = $state<Set<string>>(new Set());
  let editMode = $state(false);

  // Sheet state management
  let projectSheetOpen = $state(false);
  let projectSheetMode: 'create' | 'edit' = $state('create');
  let selectedProject: Project | undefined = $state(undefined);

  let epicSheetOpen = $state(false);
  let epicSheetMode: 'create' | 'edit' = $state('create');
  let selectedEpic: Epic | undefined = $state(undefined);
  let epicCreateProjectId: string | undefined = $state(undefined);

  // Feedback state
  let feedbackMessage = $state('');
  let feedbackType: 'success' | 'error' = $state('success');
  let showFeedback = $state(false);

  function toggleExpand(id: string) {
    const url = new URL($page.url);

    // Determine what type of node this is
    const isProject = data.projects.some((p) => p.id === id);
    const isEpic = data.projects.some((p) => p.epics?.some((e: Epic) => e.id === id));

    if (isProject) {
      if (expandedProjectId === id) {
        // Collapsing project - clear both project and epic
        url.searchParams.delete('project');
        url.searchParams.delete('epic');
      } else {
        // Expanding a different project - set new project, clear epic
        url.searchParams.set('project', id);
        url.searchParams.delete('epic');
      }
    } else if (isEpic) {
      // Find parent project for this epic
      const parentProject = data.projects.find((p) => p.epics?.some((e: Epic) => e.id === id));

      if (expandedEpicId === id) {
        // Collapsing epic - just remove epic param, keep project expanded
        url.searchParams.delete('epic');
      } else {
        // Expanding epic - ensure parent project is also in URL
        if (parentProject && !expandedProjectId) {
          url.searchParams.set('project', parentProject.id);
        }
        url.searchParams.set('epic', id);
      }
    }
    // TODO: Handle issue expansion if needed

    goto(url, { replaceState: true, noScroll: true });
  }

  function toggleSelect(id: string) {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    selectedIds = newSelected;
  }

  function handleEditModeChange(enabled: boolean) {
    editMode = enabled;
  }

  async function handleCellEdit(nodeId: string, field: string, value: any) {
    // Determine node type
    let nodeType = 'issue'; // default
    if (data.projects.some((p) => p.id === nodeId)) {
      nodeType = 'project';
    } else if (data.projects.some((p) => p.epics?.some((e: Epic) => e.id === nodeId))) {
      nodeType = 'epic';
    }

    // Submit form
    const formData = new FormData();
    formData.append('nodeId', nodeId);
    formData.append('nodeType', nodeType);
    formData.append('field', field);
    formData.append('value', value?.toString() || '');

    try {
      const response = await fetch('?/updateCell', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        await invalidateAll();
        showToast('Updated successfully', 'success');
      } else {
        showToast('Failed to update', 'error');
      }
    } catch (error) {
      console.error('Cell edit error:', error);
      showToast('Failed to update', 'error');
    }
  }

  async function handleCreateChild(
    parentId: string,
    parentType: string,
    childData: { title: string },
  ) {
    const formData = new FormData();
    formData.append('title', childData.title);

    // Determine what to create and gather required IDs
    if (parentType === 'project') {
      // Creating epic
      formData.append('projectId', parentId);
      formData.append('name', childData.title);

      try {
        const response = await fetch('?/createEpic', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          await invalidateAll();
          showToast('Epic created', 'success');
        } else {
          showToast('Failed to create epic', 'error');
        }
      } catch (error) {
        console.error('Create epic error:', error);
        showToast('Failed to create epic', 'error');
      }
    } else if (parentType === 'epic') {
      // Creating issue - need to find project ID
      const project = data.projects.find((p) => p.epics?.some((e: Epic) => e.id === parentId));
      if (!project) {
        showToast('Project not found', 'error');
        return;
      }

      formData.append('epicId', parentId);
      formData.append('projectId', project.id);

      try {
        const response = await fetch('?/createIssue', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          await invalidateAll();
          showToast('Issue created', 'success');
        } else {
          showToast('Failed to create issue', 'error');
        }
      } catch (error) {
        console.error('Create issue error:', error);
        showToast('Failed to create issue', 'error');
      }
    } else if (parentType === 'issue') {
      // Creating sub-issue - need to find epic and project IDs
      let epicId = '';
      let projectId = '';

      for (const project of data.projects) {
        const issue = project.issues?.find((i: Issue) => i.id === parentId);
        if (issue) {
          epicId = issue.epic_id;
          projectId = project.id;
          break;
        }
      }

      if (!epicId || !projectId) {
        showToast('Epic or project not found', 'error');
        return;
      }

      formData.append('parentIssueId', parentId);
      formData.append('epicId', epicId);
      formData.append('projectId', projectId);

      try {
        const response = await fetch('?/createSubIssue', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          await invalidateAll();
          showToast('Sub-issue created', 'success');
        } else {
          showToast('Failed to create sub-issue', 'error');
        }
      } catch (error) {
        console.error('Create sub-issue error:', error);
        showToast('Failed to create sub-issue', 'error');
      }
    }
  }

  function handleBulkAction(action: string) {
    if (action === 'delete') {
      // TODO: Implement bulk delete with confirmation
      console.log('Bulk delete:', selectedIds);
    }
  }

  function openProjectSheetForCreate() {
    projectSheetMode = 'create';
    selectedProject = undefined;
    projectSheetOpen = true;
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
        createEpic: 'Epic created',
        updateEpic: 'Epic updated',
        createIssue: 'Issue created',
        createSubIssue: 'Sub-issue created',
        updateCell: 'Updated',
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
  {:else}
    <!-- Tree Grid View -->
    <TreeGrid
      projects={data.projects}
      {expandedIds}
      {selectedIds}
      {editMode}
      onToggleExpand={toggleExpand}
      onToggleSelect={toggleSelect}
      onEditModeChange={handleEditModeChange}
      onCellEdit={handleCellEdit}
      onCreateChild={handleCreateChild}
      onBulkAction={handleBulkAction}
      onShowToast={showToast}
      onIssueClick={openIssueSheet}
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
