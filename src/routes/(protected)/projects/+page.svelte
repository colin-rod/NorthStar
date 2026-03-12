<script lang="ts">
  /**
   * Projects List Page - Tree Grid View
   *
   * Displays all projects with unified tree grid:
   * Projects → Epics → Issues → Sub-issues
   */

  import { untrack } from 'svelte';
  import { page } from '$app/stores';
  import { goto, invalidateAll } from '$app/navigation';
  import { deserialize } from '$app/forms';
  import TreeGrid from '$lib/components/tree-grid/TreeGrid.svelte';
  import ProjectDetailSheet from '$lib/components/ProjectDetailSheet.svelte';
  import EpicDetailSheet from '$lib/components/EpicDetailSheet.svelte';
  import IssueSheet from '$lib/components/IssueSheet.svelte';
  import NewButtonDropdown from '$lib/components/NewButtonDropdown.svelte';
  import FilterPanel from '$lib/components/FilterPanel.svelte';
  import ActiveFilterChips from '$lib/components/ActiveFilterChips.svelte';
  import IssueGroupBySelector from '$lib/components/IssueGroupBySelector.svelte';
  import IssueSortBySelector from '$lib/components/IssueSortBySelector.svelte';
  import type { PageData } from './$types';
  import type { Project, Epic, Issue } from '$lib/types';
  import {
    VALID_ISSUE_STATUSES,
    VALID_EPIC_STATUSES,
    VALID_PROJECT_STATUSES,
  } from '$lib/constants/validation';
  import { computeIssueCounts } from '$lib/utils/issue-counts';
  import type { IssueCounts } from '$lib/utils/issue-counts';
  import type { ProjectMetrics } from '$lib/utils/project-helpers';
  import {
    isIssueSheetOpen,
    selectedIssue,
    openIssueSheet,
    openCreateIssueSheet,
    projectSheetOpen,
  } from '$lib/stores/issues';
  import ContextMenu from '$lib/components/ContextMenu.svelte';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import FolderOpen from '@lucide/svelte/icons/folder-open';
  import SearchX from '@lucide/svelte/icons/search-x';
  import ChevronUp from '@lucide/svelte/icons/chevron-up';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
  import type { TreeNode } from '$lib/types/tree-grid';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { toast } from 'svelte-sonner';

  let { data }: { data: PageData } = $props();

  // URL-based state for expanded items (enables deep-linking)
  let expandedProjectId = $derived($page.url.searchParams.get('project') || null);
  let expandedEpicId = $derived($page.url.searchParams.get('epic') || null);
  let openIssueId = $derived($page.url.searchParams.get('issue') || null);

  // Build expandedIds set from URL params
  let expandedIds = $derived.by(() => {
    const ids = new Set<string>();
    if (expandedProjectId) ids.add(expandedProjectId);
    if (expandedEpicId) ids.add(expandedEpicId);
    return ids;
  });

  // Component-local state
  let selectedIds = $state<Set<string>>(new Set());

  // Project detail sheet state (handles both create and edit)
  let projectDetailSheetOpen = $state(false);
  let projectDetailSheetMode: 'create' | 'edit' = $state('edit');
  let selectedProjectForDetail: Project | null = $state(null);
  let selectedProjectCounts: IssueCounts | null = $state(null);
  let selectedProjectMetrics: ProjectMetrics | null = $state(null);
  let selectedProjectEpics: Epic[] = $state([]);

  // Epic detail sheet state (handles both create and edit)
  let epicDetailSheetOpen = $state(false);
  let epicDetailSheetMode: 'create' | 'edit' = $state('edit');
  let epicCreateProjectId: string | null = $state(null);
  let selectedEpicForDetail: Epic | null = $state(null);
  let selectedEpicCounts: IssueCounts | null = $state(null);
  let selectedEpicIssues: Issue[] = $state([]);

  // Bulk delete dialog state
  let bulkDeleteDialogOpen = $state(false);

  // Context menu state
  let contextMenuOpen = $state(false);
  let contextMenuNode = $state<TreeNode | null>(null);
  let contextMenuX = $state(0);
  let contextMenuY = $state(0);
  let contextMenuBulkCount = $state(0);
  let contextMenuSelectedTypes = $state<Set<'project' | 'epic' | 'issue'>>(new Set());

  // Inline rename state
  let editingNodeId = $state<string | null>(null);

  // Filter panel state
  let filterPanelOpen = $state(false);

  function toggleFilterPanel() {
    filterPanelOpen = !filterPanelOpen;
  }

  // Count active filters
  let activeFilterCount = $derived.by(() => {
    const { projectStatus, epicStatus, issuePriority, issueStatus, issueStoryPoints } =
      data.filterParams;
    return (
      projectStatus.length +
      epicStatus.length +
      issuePriority.length +
      issueStatus.length +
      issueStoryPoints.length
    );
  });

  // Sync store with local state for project sheet
  $effect(() => {
    if ($projectSheetOpen && !projectDetailSheetOpen) {
      // Store requested open - trigger create mode
      openProjectSheetForCreate();
    }
  });

  // Sync local state back to store when sheet closes
  $effect(() => {
    if (!projectDetailSheetOpen && $projectSheetOpen) {
      projectSheetOpen.set(false);
    }
  });

  // Auto-open IssueSheet when ?issue=<id> is present in URL (deep-link support)
  $effect(() => {
    if (!openIssueId) return;
    const allIssues = data.projects.flatMap((p) => p.epics?.flatMap((e) => e.issues || []) || []);
    const issue = allIssues.find((i) => i.id === openIssueId);
    if (issue && !untrack(() => $isIssueSheetOpen)) {
      openIssueSheet({
        ...issue,
        blocked_by: issue.blocked_by || [],
        blocking: issue.blocking || [],
      });
    }
  });

  // Clear ?issue= param when IssueSheet closes
  $effect(() => {
    if (!$isIssueSheetOpen && openIssueId) {
      const url = new URL($page.url);
      url.searchParams.delete('issue');
      goto(url, { replaceState: true, noScroll: true });
    }
  });

  // Sync selectedIssue with fresh data after invalidateAll (e.g. after adding a dependency)
  $effect(() => {
    const projects = data.projects;
    const currentIssue = untrack(() => $selectedIssue);
    const sheetOpen = untrack(() => $isIssueSheetOpen);

    if (currentIssue && sheetOpen) {
      const freshIssue = projects
        .flatMap((p) => p.epics?.flatMap((e) => e.issues || []) || [])
        .find((i) => i.id === currentIssue.id);
      if (freshIssue) {
        selectedIssue.set(freshIssue);
      }
    }
  });

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
    } else {
      // Issues are leaf nodes - opening is handled via handleIssueClick
      return;
    }

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

  async function handleCellEdit(nodeId: string, field: string, value: any) {
    const nodeType = resolveNodeType(nodeId);

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
        toast.success('Updated successfully');
      } else {
        toast.error('Failed to update');
      }
    } catch (error) {
      console.error('Cell edit error:', error);
      toast.error('Failed to update');
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
          toast.success('Epic created');
        } else {
          toast.error('Failed to create epic');
        }
      } catch (error) {
        console.error('Create epic error:', error);
        toast.error('Failed to create epic');
      }
    } else if (parentType === 'epic') {
      // Creating issue - need to find project ID
      const project = data.projects.find((p) => p.epics?.some((e: Epic) => e.id === parentId));
      if (!project) {
        toast.error('Project not found');
        return;
      }

      formData.append('epicId', parentId);
      formData.append('projectId', project.id);

      try {
        const response = await fetch('?/createIssue', {
          method: 'POST',
          body: formData,
        });

        const result = deserialize(await response.text());

        if (result.type === 'success') {
          const newIssue = (result.data as any).issue;
          await invalidateAll();
          openIssueSheet({ ...newIssue, blocked_by: [], blocking: [] });
          toast.success('Issue created');
        } else {
          toast.error('Failed to create issue');
        }
      } catch (error) {
        console.error('Create issue error:', error);
        toast.error('Failed to create issue');
      }
    }
  }

  function resolveNodeType(id: string): 'project' | 'epic' | 'issue' {
    if (data.projects.some((p) => p.id === id)) return 'project';
    if (data.projects.some((p) => p.epics?.some((e: Epic) => e.id === id))) return 'epic';
    return 'issue';
  }

  function handleBulkAction(action: string) {
    if (action === 'delete') {
      bulkDeleteDialogOpen = true;
    }
  }

  async function handleBulkEdit(field: string, value: string) {
    const issueStatuses = VALID_ISSUE_STATUSES as readonly string[];
    const epicStatuses = VALID_EPIC_STATUSES as readonly string[];
    const projectStatuses = VALID_PROJECT_STATUSES as readonly string[];

    const eligible = Array.from(selectedIds)
      .map((id) => ({ id, type: resolveNodeType(id) }))
      .filter(({ type }) => {
        if (field === 'status') {
          return type === 'issue'
            ? issueStatuses.includes(value)
            : type === 'epic'
              ? epicStatuses.includes(value)
              : projectStatuses.includes(value);
        }
        // priority, story_points, milestone_id only apply to issues
        return type === 'issue';
      });

    if (eligible.length === 0) {
      toast.error('No compatible items to update');
      return;
    }

    const fetches = eligible.map(({ id, type }) => {
      const formData = new FormData();
      formData.append('nodeId', id);
      formData.append('nodeType', type);
      formData.append('field', field);
      formData.append('value', value);
      return fetch('?/updateCell', { method: 'POST', body: formData });
    });

    try {
      const results = await Promise.all(fetches);
      const failed = results.filter((r) => !r.ok).length;
      const skipped = selectedIds.size - eligible.length;
      selectedIds = new Set();
      await invalidateAll();
      const skippedMsg = skipped > 0 ? `, ${skipped} skipped` : '';
      if (failed > 0) {
        toast.error(`${failed} item(s) failed to update`);
      } else {
        toast.success(`${eligible.length} updated${skippedMsg}`);
      }
    } catch {
      toast.error('Failed to update');
    }
  }

  async function confirmBulkDelete() {
    bulkDeleteDialogOpen = false;
    const actionMap: Record<string, string> = {
      project: '?/deleteProject',
      epic: '?/deleteEpic',
      issue: '?/deleteIssue',
    };

    const deletes = Array.from(selectedIds).map((id) => {
      const type = resolveNodeType(id);
      const formData = new FormData();
      formData.append('id', id);
      return fetch(actionMap[type], { method: 'POST', body: formData });
    });

    try {
      const results = await Promise.all(deletes);
      const failed = results.filter((r) => !r.ok).length;
      selectedIds = new Set();
      await invalidateAll();
      if (failed > 0) {
        toast.error(`${failed} item(s) failed to delete`);
      } else {
        toast.success(`${deletes.length} item(s) deleted`);
      }
    } catch {
      toast.error('Failed to delete items');
    }
  }

  function openProjectSheetForCreate() {
    projectDetailSheetMode = 'create';
    selectedProjectForDetail = null;
    selectedProjectCounts = null;
    selectedProjectMetrics = null;
    selectedProjectEpics = [];
    projectDetailSheetOpen = true;
  }

  function handleProjectDoubleClick(
    project: Project,
    counts: IssueCounts,
    metrics: ProjectMetrics,
    epics: Epic[],
  ) {
    projectDetailSheetMode = 'edit';
    selectedProjectForDetail = project;
    selectedProjectCounts = counts;
    selectedProjectMetrics = metrics;
    selectedProjectEpics = epics;
    projectDetailSheetOpen = true;
  }

  function handleEpicDoubleClick(epic: Epic, counts: IssueCounts) {
    epicDetailSheetMode = 'edit';
    selectedEpicForDetail = epic;
    selectedEpicCounts = counts;
    selectedEpicIssues = epic.issues ?? [];
    epicDetailSheetOpen = true;
  }

  function handleEpicClickFromProjectSheet(epic: Epic) {
    epicDetailSheetMode = 'edit';
    selectedEpicForDetail = epic;
    selectedEpicCounts = computeIssueCounts(epic.issues ?? []);
    selectedEpicIssues = epic.issues ?? [];
    epicDetailSheetOpen = true;
  }

  function handleAddEpicFromProjectSheet() {
    if (!selectedProjectForDetail) return;
    epicDetailSheetMode = 'create';
    epicCreateProjectId = selectedProjectForDetail.id;
    selectedEpicForDetail = null;
    selectedEpicCounts = null;
    selectedEpicIssues = [];
    epicDetailSheetOpen = true;
  }

  // --- Context menu handlers ---

  function handleContextMenu(node: TreeNode, event: MouseEvent) {
    contextMenuX = event.clientX;
    contextMenuY = event.clientY;
    contextMenuNode = node;

    // Bulk mode: right-clicked node is selected AND multiple items selected
    if (selectedIds.has(node.id) && selectedIds.size > 1) {
      contextMenuBulkCount = selectedIds.size;
      contextMenuSelectedTypes = new Set(
        Array.from(selectedIds).map((id) => resolveNodeType(id) as 'project' | 'epic' | 'issue'),
      );
    } else {
      contextMenuBulkCount = 0;
      contextMenuSelectedTypes = new Set();
    }

    contextMenuOpen = true;
  }

  function handleContextMenuClose() {
    contextMenuOpen = false;
    contextMenuNode = null;
    contextMenuBulkCount = 0;
    contextMenuSelectedTypes = new Set();
  }

  async function handleContextStatusChange(node: TreeNode, status: string) {
    await handleCellEdit(node.id, 'status', status);
  }

  async function handleContextPriorityChange(node: TreeNode, priority: number) {
    await handleCellEdit(node.id, 'priority', priority.toString());
  }

  async function handleContextStoryPointsChange(node: TreeNode, points: number) {
    await handleCellEdit(node.id, 'story_points', points.toString());
  }

  async function handleContextMilestoneChange(node: TreeNode, milestoneId: string | null) {
    const formData = new FormData();
    formData.append('id', node.id);
    formData.append('milestone_id', milestoneId ?? '');
    try {
      const response = await fetch('?/updateEpic', { method: 'POST', body: formData });
      if (response.ok) {
        await invalidateAll();
        toast.success('Milestone updated');
      } else {
        toast.error('Failed to update milestone');
      }
    } catch {
      toast.error('Failed to update milestone');
    }
  }

  function handleContextRename(node: TreeNode) {
    editingNodeId = node.id;
  }

  function handleContextAddChild(node: TreeNode) {
    if (node.type === 'project') {
      // Add Epic to project
      epicDetailSheetMode = 'create';
      epicCreateProjectId = node.id;
      selectedEpicForDetail = null;
      selectedEpicCounts = null;
      epicDetailSheetOpen = true;
    } else if (node.type === 'epic') {
      // Add Issue to epic - open create issue sheet pre-seeded with this epic's project
      const parentProject = data.projects.find((p) => p.epics?.some((e: Epic) => e.id === node.id));
      openCreateIssueSheet(
        parentProject ? { projectId: parentProject.id, epicId: node.id } : undefined,
      );
    } else if (node.type === 'issue') {
      // Add Sub-issue to issue - use inline form
      handleCreateChild(node.id, 'issue', { title: '' });
    }
  }

  async function handleContextArchive(node: TreeNode) {
    const formData = new FormData();
    formData.append('id', node.id);
    try {
      const response = await fetch('?/archiveProject', { method: 'POST', body: formData });
      if (response.ok) {
        await invalidateAll();
        toast.success('Project archived');
      } else {
        toast.error('Failed to archive project');
      }
    } catch {
      toast.error('Failed to archive project');
    }
  }

  async function handleContextDelete(node: TreeNode) {
    const actionMap: Record<string, string> = {
      project: '?/deleteProject',
      epic: '?/deleteEpic',
      issue: '?/deleteIssue',
      'sub-issue': '?/deleteIssue',
    };
    const action = actionMap[node.type];
    if (!action) return;

    const formData = new FormData();
    formData.append('id', node.id);
    try {
      const response = await fetch(action, { method: 'POST', body: formData });
      if (response.ok) {
        await invalidateAll();
        toast.success(`${node.type} deleted`);
      } else {
        toast.error(`Failed to delete ${node.type}`);
      }
    } catch {
      toast.error(`Failed to delete ${node.type}`);
    }
  }

  async function handleContextMoveToProject(node: TreeNode, projectId: string) {
    const formData = new FormData();
    formData.append('epicId', node.id);
    formData.append('newProjectId', projectId);
    try {
      const response = await fetch('?/moveEpic', { method: 'POST', body: formData });
      if (response.ok) {
        await invalidateAll();
        toast.success('Epic moved');
      } else {
        toast.error('Failed to move epic');
      }
    } catch {
      toast.error('Failed to move epic');
    }
  }

  async function handleContextMoveToEpic(node: TreeNode, epicId: string) {
    const targetEpic = data.projects.flatMap((p) => p.epics || []).find((e) => e.id === epicId);
    const formData = new FormData();
    formData.append(
      'update',
      JSON.stringify({
        id: node.id,
        newSortOrder: 999999,
        newEpicId: epicId,
        newProjectId: targetEpic?.project_id,
      }),
    );
    try {
      const response = await fetch('?/reparentNode', { method: 'POST', body: formData });
      if (response.ok) {
        await invalidateAll();
        toast.success('Issue moved');
      } else {
        toast.error('Failed to move issue');
      }
    } catch {
      toast.error('Failed to move issue');
    }
  }

  function handleIssueClick(issue: Issue) {
    const url = new URL($page.url);
    url.searchParams.set('issue', issue.id);
    goto(url, { replaceState: true, noScroll: true });
    openIssueSheet({
      ...issue,
      blocked_by: issue.blocked_by || [],
      blocking: issue.blocking || [],
    });
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
      toast.success(message);
    } else if (form?.error) {
      toast.error(form.error);
    }
  });
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <h1 class="font-accent text-page-title">Projects</h1>
    <div class="flex gap-2 items-center flex-wrap justify-end">
      <!-- Grouping Selector -->
      <IssueGroupBySelector selectedGroupBy={data.filterParams.groupBy} />

      <!-- Sorting Selector -->
      <IssueSortBySelector
        selected={data.filterParams.sortBy}
        direction={data.filterParams.sortDir}
      />

      <!-- Filters Button -->
      <button
        onclick={toggleFilterPanel}
        aria-expanded={filterPanelOpen}
        aria-controls="filter-panel"
        aria-label="Filters"
        class="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-surface-subtle hover:text-foreground"
      >
        <SlidersHorizontal class="h-4 w-4 shrink-0" />
        <span class="hidden md:inline">Filters</span>
        {#if activeFilterCount > 0}
          <span class="rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-xs">
            {activeFilterCount}
          </span>
        {/if}
        <span class="hidden md:inline">
          {#if filterPanelOpen}
            <ChevronUp class="h-4 w-4 text-muted-foreground" />
          {:else}
            <ChevronDown class="h-4 w-4 text-muted-foreground" />
          {/if}
        </span>
      </button>
      <NewButtonDropdown />
    </div>
  </div>

  <!-- Active Filter Chips (always visible when filters are active) -->
  <ActiveFilterChips filterParams={data.filterParams} />

  <!-- Filter Panel -->
  <FilterPanel filterParams={data.filterParams} open={filterPanelOpen} />

  {#if data.projects.length === 0}
    {#if activeFilterCount > 0}
      <EmptyState
        icon={SearchX}
        title="No projects match"
        description="Try adjusting your filters to see more results"
        ctaLabel="Clear filters"
        onCtaClick={() => {
          const params = new URLSearchParams($page.url.searchParams);
          params.delete('project_status');
          params.delete('epic_status');
          params.delete('priority');
          params.delete('status');
          params.delete('story_points');
          goto(`${$page.url.pathname}?${params.toString()}`, {
            replaceState: false,
            noScroll: true,
          });
        }}
      />
    {:else}
      <EmptyState
        icon={FolderOpen}
        title="No projects yet."
        description="Create a project to start organizing your work."
        ctaLabel="New Project"
        onCtaClick={() => projectSheetOpen.set(true)}
      />
    {/if}
  {:else}
    <!-- Tree Grid View -->
    <TreeGrid
      projects={data.projects}
      {expandedIds}
      {selectedIds}
      groupBy={data.filterParams.groupBy}
      onToggleExpand={toggleExpand}
      onToggleSelect={toggleSelect}
      onCellEdit={handleCellEdit}
      onCreateChild={handleCreateChild}
      onBulkAction={handleBulkAction}
      onBulkEdit={handleBulkEdit}
      milestones={data.milestones ?? []}
      onIssueClick={handleIssueClick}
      onProjectClick={handleProjectDoubleClick}
      onEpicClick={handleEpicDoubleClick}
      onContextMenu={handleContextMenu}
      onAddChildRow={handleContextAddChild}
      {editingNodeId}
      onStopEditNode={() => (editingNodeId = null)}
    />
  {/if}
</div>

<!-- Project detail sheet (handles both create and edit) -->
<ProjectDetailSheet
  bind:open={projectDetailSheetOpen}
  mode={projectDetailSheetMode}
  project={selectedProjectForDetail}
  counts={selectedProjectCounts}
  metrics={selectedProjectMetrics}
  epics={selectedProjectEpics}
  userId={data.session?.user?.id ?? ''}
  onEpicClick={handleEpicClickFromProjectSheet}
  onAddEpic={handleAddEpicFromProjectSheet}
/>

<!-- Epic detail sheet (handles both create and edit) -->
<EpicDetailSheet
  bind:open={epicDetailSheetOpen}
  mode={epicDetailSheetMode}
  epic={selectedEpicForDetail}
  projectId={epicCreateProjectId ?? undefined}
  projectName={data.projects.find(
    (p) => p.id === (epicCreateProjectId ?? selectedEpicForDetail?.project_id),
  )?.name}
  counts={selectedEpicCounts}
  issues={selectedEpicIssues}
  userId={data.session?.user?.id ?? ''}
  milestones={data.milestones ?? []}
  projects={data.projects.map((p) => ({ id: p.id, name: p.name }))}
  onIssueClick={(issue) =>
    openIssueSheet({
      ...issue,
      blocked_by: issue.blocked_by || [],
      blocking: issue.blocking || [],
    })}
/>

<!-- Issue sheet (using store) -->
<IssueSheet
  bind:open={$isIssueSheetOpen}
  mode={$selectedIssue ? 'edit' : 'create'}
  issue={$selectedIssue}
  epics={data.projects.flatMap((p) => p.epics || [])}
  milestones={[]}
  projectIssues={data.projects.flatMap((p) => p.epics?.flatMap((e) => e.issues || []) || [])}
  projects={data.projects}
  userId={data.session?.user?.id ?? ''}
/>

<!-- Right-click context menu -->
<ContextMenu
  node={contextMenuNode}
  x={contextMenuX}
  y={contextMenuY}
  bind:open={contextMenuOpen}
  onClose={handleContextMenuClose}
  onRename={handleContextRename}
  onStatusChange={handleContextStatusChange}
  onAddChild={handleContextAddChild}
  onArchive={handleContextArchive}
  onDelete={handleContextDelete}
  onPriorityChange={handleContextPriorityChange}
  onStoryPointsChange={handleContextStoryPointsChange}
  milestones={data.milestones ?? []}
  onMilestoneChange={handleContextMilestoneChange}
  projects={data.projects.map((p) => ({ id: p.id, name: p.name }))}
  allEpics={data.projects.flatMap((p) =>
    (p.epics || []).map((e) => ({
      id: e.id,
      name: e.name,
      project_id: e.project_id,
      is_default: e.is_default,
    })),
  )}
  onMoveToProject={handleContextMoveToProject}
  onMoveToEpic={handleContextMoveToEpic}
  bulkCount={contextMenuBulkCount}
  selectedTypes={contextMenuSelectedTypes}
  onBulkStatusChange={(status) => handleBulkEdit('status', status)}
  onBulkPriorityChange={(p) => handleBulkEdit('priority', p.toString())}
  onBulkStoryPointsChange={(pts) => handleBulkEdit('story_points', pts.toString())}
  onBulkMilestoneChange={(id) => handleBulkEdit('milestone_id', id ?? '')}
  onBulkDelete={() => {
    bulkDeleteDialogOpen = true;
  }}
/>

<!-- Bulk delete confirmation dialog -->
<Dialog.Root bind:open={bulkDeleteDialogOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Delete {selectedIds.size} item{selectedIds.size === 1 ? '' : 's'}?</Dialog.Title
      >
      <Dialog.Description>
        This will permanently delete the selected items. This action cannot be undone.
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (bulkDeleteDialogOpen = false)}>Cancel</Button>
      <Button variant="destructive" onclick={confirmBulkDelete}>
        Delete {selectedIds.size} item{selectedIds.size === 1 ? '' : 's'}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
