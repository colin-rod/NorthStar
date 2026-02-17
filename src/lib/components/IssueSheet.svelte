<script lang="ts">
  /**
   * IssueSheet Component - North Design System
   *
   * Bottom sheet/drawer for editing issue details with auto-save.
   * Mobile-first design pattern.
   *
   * North Design Principles:
   * - White surface with level 2 shadow
   * - Sections separated by 24px spacing (not heavy borders)
   * - Labels: 12px uppercase, muted color
   * - Input spacing: 8px between label and control
   * - Clean, minimal sections
   *
   * Requirements from CLAUDE.md:
   * - Auto-save on field change
   * - Editable fields: title, status, priority, story_points, epic, milestone
   * - Inline dependency display (Blocked by / Blocking)
   * - Collapsible sub-issues list
   */

  import type { Issue, Epic, Milestone, IssueStatus, StoryPoints } from '$lib/types';
  import { Sheet, SheetContent, SheetHeader, SheetTitle } from '$lib/components/ui/sheet';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { invalidateAll } from '$app/navigation';
  import { getBlockingDependencies } from '$lib/utils/issue-helpers';
  import { ALLOWED_STORY_POINTS } from '$lib/utils/issue-helpers';
  import InlineSubIssueForm from '$lib/components/InlineSubIssueForm.svelte';
  import DependencyManagementSection from '$lib/components/DependencyManagementSection.svelte';
  import MilestonePicker from '$lib/components/MilestonePicker.svelte';
  import { useMediaQuery } from '$lib/hooks/useMediaQuery.svelte';
  import { useKeyboardAwareHeight } from '$lib/hooks/useKeyboardAwareHeight.svelte';

  // Props
  let {
    open = $bindable(false),
    mode = 'edit',
    issue = $bindable<Issue | null>(null),
    epics = [],
    milestones = [],
    projectIssues = [],
    projects = [],
  }: {
    open: boolean;
    mode?: 'edit' | 'create';
    issue: Issue | null;
    epics: Epic[];
    milestones: Milestone[];
    projectIssues: Issue[];
    projects?: { id: string; name: string }[];
  } = $props();

  // Local state for form fields
  let localTitle = $state('');
  let localStatus = $state<IssueStatus>('todo');
  let localPriority = $state(2);
  let localStoryPoints = $state<StoryPoints | null>(null);
  let localEpicId = $state('');
  let localMilestoneId = $state<string | null>(null);

  // Loading and error state
  let loading = $state(false);
  let saveError = $state<string | null>(null);
  let saveSuccess = $state(false);

  // Sub-issues state
  let showSubIssueForm = $state(false);

  // Create mode state
  let selectedProjectId = $state('');
  let createLoading = $state(false);

  // Debounce timer for title field
  let titleDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  // Ref for sheet content (keyboard-aware height)
  let sheetContentRef = $state<HTMLElement | null>(null);

  // Responsive behavior: desktop uses right-side drawer, mobile uses bottom sheet
  const isDesktop = useMediaQuery('(min-width: 768px)');
  let sheetSide = $derived<'right' | 'bottom'>(isDesktop() ? 'right' : 'bottom');
  let sheetClass = $derived(
    isDesktop() ? 'w-[600px] h-screen overflow-y-auto p-6' : 'overflow-y-auto relative', // No max-h, handled by hook
  );

  // Apply keyboard-aware height on mobile only
  $effect(() => {
    if (!isDesktop() && sheetContentRef) {
      useKeyboardAwareHeight(sheetContentRef);
    }
  });

  // Initialize local state when issue changes (edit mode)
  $effect(() => {
    if (issue) {
      localTitle = issue.title;
      localStatus = issue.status;
      localPriority = issue.priority;
      localStoryPoints = issue.story_points;
      localEpicId = issue.epic_id;
      localMilestoneId = issue.milestone_id;
      saveError = null;
      saveSuccess = false;
    }
  });

  // Initialize create mode defaults when sheet opens
  $effect(() => {
    if (mode === 'create' && open) {
      localTitle = '';
      localStatus = 'todo';
      localPriority = 2;
      localStoryPoints = null;
      localMilestoneId = null;
      saveError = null;
      if (projects.length > 0 && !selectedProjectId) {
        selectedProjectId = projects[0].id;
      }
    }
  });

  // Auto-select first epic when project changes in create mode
  $effect(() => {
    if (mode === 'create' && selectedProjectId) {
      const firstEpic = epics.find((e) => e.project_id === selectedProjectId);
      localEpicId = firstEpic?.id ?? '';
    }
  });

  // Reset create mode state when sheet closes
  $effect(() => {
    if (!open && mode === 'create') {
      selectedProjectId = '';
      localEpicId = '';
      createLoading = false;
    }
  });

  // Filter epics to only show those from the relevant project
  let projectEpics = $derived(
    mode === 'create'
      ? epics.filter((epic) => epic.project_id === selectedProjectId)
      : issue
        ? epics.filter((epic) => epic.project_id === issue?.project_id)
        : [],
  );

  // Get blocking dependencies (issues that block this one)
  // Use server-provided data and filter for active blockers (not done/canceled)
  let blockedByIssues = $derived(
    issue?.blocked_by
      ?.map((dep) => dep.depends_on_issue)
      .filter(
        (i): i is Issue => i !== undefined && i.status !== 'done' && i.status !== 'canceled',
      ) || [],
  );

  // Get issues that this issue blocks
  // Use server-provided data directly
  let blockingIssues = $derived(
    issue?.blocking?.map((dep) => dep.issue).filter((i): i is Issue => i !== undefined) || [],
  );

  // Get sub-issues
  let subIssues = $derived(issue?.sub_issues || []);

  // Helper to get status badge variant
  function getStatusVariant(
    status: IssueStatus,
  ):
    | 'secondary'
    | 'default'
    | 'outline'
    | 'destructive'
    | 'status-todo'
    | 'status-doing'
    | 'status-in-review'
    | 'status-done'
    | 'status-blocked'
    | 'status-canceled'
    | undefined {
    const variantMap: Record<IssueStatus, any> = {
      todo: 'status-todo',
      doing: 'status-doing',
      in_review: 'status-in-review',
      done: 'status-done',
      canceled: 'status-canceled',
    };
    return variantMap[status];
  }

  // Auto-save function
  async function autoSave(field: string, value: any) {
    if (!issue) return;

    loading = true;
    saveError = null;
    saveSuccess = false;

    try {
      const formData = new FormData();
      formData.append('id', issue.id);
      formData.append(field, value?.toString() ?? '');

      const response = await fetch('?/updateIssue', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.type === 'success') {
        // Reload data to get updated issue
        await invalidateAll();
        saveSuccess = true;
        setTimeout(() => {
          saveSuccess = false;
        }, 2000);
      } else {
        const error = result.data?.error || 'Failed to save';
        saveError = error;
        setTimeout(() => {
          saveError = null;
        }, 5000);
      }
    } catch (error) {
      console.error('Auto-save error:', error);
      saveError = 'Network error - please try again';
      setTimeout(() => {
        saveError = null;
      }, 5000);
    } finally {
      loading = false;
    }
  }

  // Create issue form submission
  async function handleCreateSubmit(event: Event) {
    event.preventDefault();

    if (!localTitle.trim()) {
      saveError = 'Issue title is required';
      return;
    }
    if (!selectedProjectId || !localEpicId) {
      saveError = 'Project and epic are required';
      return;
    }

    createLoading = true;
    saveError = null;

    try {
      const formData = new FormData();
      formData.append('title', localTitle.trim());
      formData.append('project_id', selectedProjectId);
      formData.append('epic_id', localEpicId);

      const response = await fetch('?/createIssue', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.type === 'success') {
        await invalidateAll();
        open = false;
      } else {
        saveError = result.data?.error || 'Failed to create issue';
      }
    } catch (error) {
      console.error('Create issue error:', error);
      saveError = 'Network error - please try again';
    } finally {
      createLoading = false;
    }
  }

  // Track previous values to detect changes
  let prevStatus = $state<IssueStatus>('todo');
  let prevPriority = $state(2);
  let prevStoryPoints = $state<StoryPoints | null>(null);
  let prevEpicId = $state('');

  // Field change handlers
  function handleTitleChange(event: Event) {
    const input = event.target as HTMLInputElement;
    localTitle = input.value;

    // Debounce title updates (wait 500ms after user stops typing)
    if (titleDebounceTimer) {
      clearTimeout(titleDebounceTimer);
    }
    titleDebounceTimer = setTimeout(() => {
      if (localTitle !== issue?.title) {
        autoSave('title', localTitle);
      }
    }, 500);
  }

  function handleStatusChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    localStatus = select.value as IssueStatus;
  }

  function handlePriorityChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    localPriority = parseInt(select.value);
  }

  function handleStoryPointsChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    if (select.value === 'null') {
      localStoryPoints = null;
    } else {
      localStoryPoints = parseInt(select.value) as StoryPoints;
    }
  }

  function handleEpicChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    localEpicId = select.value;
  }

  // Watch for changes and auto-save
  $effect(() => {
    if (localStatus !== prevStatus && localStatus !== issue?.status) {
      autoSave('status', localStatus);
      prevStatus = localStatus;
    }
  });

  $effect(() => {
    if (localPriority !== prevPriority && localPriority !== issue?.priority) {
      autoSave('priority', localPriority);
      prevPriority = localPriority;
    }
  });

  $effect(() => {
    if (localStoryPoints !== prevStoryPoints && localStoryPoints !== issue?.story_points) {
      autoSave('story_points', localStoryPoints);
      prevStoryPoints = localStoryPoints;
    }
  });

  $effect(() => {
    if (localEpicId !== prevEpicId && localEpicId !== issue?.epic_id) {
      autoSave('epic_id', localEpicId);
      prevEpicId = localEpicId;
    }
  });

  // Format status for display
  function formatStatus(status: IssueStatus): string {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
</script>

<Sheet bind:open>
  <SheetContent
    bind:ref={sheetContentRef}
    side={sheetSide}
    class={sheetClass}
    onOpenChange={(isOpen) => {
      open = isOpen;
    }}
  >
    {#if mode === 'create' || issue}
      <!-- Loading overlay -->
      {#if loading || createLoading}
        <div
          class="absolute inset-0 bg-background/50 flex items-center justify-center z-50 rounded-t-lg"
        >
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      {/if}

      <!-- Header -->
      <SheetHeader class="mb-6">
        <SheetTitle class="font-accent text-page-title">
          {#if mode === 'create'}
            New Issue
          {:else if issue}
            <span class="text-muted-foreground font-mono text-base">I-{issue.number}</span>
            <span class="mx-2 text-muted-foreground">·</span>
            {issue.title}
          {:else}
            Edit Issue
          {/if}
        </SheetTitle>
      </SheetHeader>

      <!-- Success/Error Toast -->
      {#if saveSuccess}
        <div
          class="mb-4 p-3 rounded-md bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 text-sm"
        >
          Changes saved successfully
        </div>
      {/if}
      {#if saveError}
        <div
          class="mb-4 p-3 rounded-md bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 text-sm"
        >
          {saveError}
        </div>
      {/if}

      {#if mode === 'create'}
        <!-- Create mode: form with submit button -->
        <form onsubmit={handleCreateSubmit} class="space-y-6 pb-6">
          <!-- Basic Info Section -->
          <section>
            <h3 class="text-xs uppercase font-medium text-foreground-muted mb-3 tracking-wide">
              Basic Info
            </h3>
            <div>
              <Label for="title" class="text-metadata mb-2 block">Title</Label>
              <Input
                id="title"
                name="title"
                value={localTitle}
                oninput={(e) => {
                  localTitle = e.currentTarget.value;
                }}
                required
                disabled={createLoading}
                placeholder="What needs to be done?"
                class="text-body"
              />
            </div>
          </section>

          <!-- Organization Section -->
          <section>
            <h3 class="text-xs uppercase font-medium text-foreground-muted mb-3 tracking-wide">
              Organization
            </h3>
            <div class="space-y-4">
              <!-- Project Select -->
              <div>
                <Label for="project" class="text-metadata mb-2 block">Project</Label>
                <select
                  id="project"
                  bind:value={selectedProjectId}
                  required
                  disabled={createLoading}
                  class="flex min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {#each projects as project (project.id)}
                    <option value={project.id}>{project.name}</option>
                  {/each}
                </select>
              </div>

              <!-- Epic Select -->
              <div>
                <Label for="epic" class="text-metadata mb-2 block">Epic</Label>
                <select
                  id="epic"
                  bind:value={localEpicId}
                  required
                  disabled={createLoading}
                  class="flex min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {#each projectEpics as epic (epic.id)}
                    <option value={epic.id}>{epic.name}</option>
                  {/each}
                </select>
              </div>
            </div>
          </section>

          <!-- Submit Button -->
          <Button type="submit" disabled={createLoading || !localTitle.trim()} class="w-full">
            {createLoading ? 'Creating...' : 'Create Issue'}
          </Button>
        </form>
      {:else}
        <!-- Edit mode: auto-save behavior -->
        <div class="space-y-6 pb-6">
          <!-- Basic Info Section -->
          <section>
            <h3 class="text-xs uppercase font-medium text-foreground-muted mb-3 tracking-wide">
              Basic Info
            </h3>
            <div class="space-y-4">
              <!-- Title -->
              <div>
                <Label for="title" class="text-metadata mb-2 block">Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={localTitle}
                  oninput={handleTitleChange}
                  required
                  disabled={loading}
                  class="text-body"
                />
              </div>

              <!-- Status & Priority Row -->
              <div class="flex gap-4">
                <!-- Status Select -->
                <div class="flex-1">
                  <Label for="status" class="text-metadata mb-2 block">Status</Label>
                  <select
                    id="status"
                    bind:value={localStatus}
                    onchange={handleStatusChange}
                    disabled={loading}
                    class="flex min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="todo">Todo</option>
                    <option value="doing">In Progress</option>
                    <option value="in_review">In Review</option>
                    <option value="done">Done</option>
                    <option value="canceled">Canceled</option>
                  </select>
                </div>

                <!-- Priority Select -->
                <div class="flex-1">
                  <Label for="priority" class="text-metadata mb-2 block">Priority</Label>
                  <select
                    id="priority"
                    bind:value={localPriority}
                    onchange={handlePriorityChange}
                    disabled={loading}
                    class="flex min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value={0}>P0 (Critical)</option>
                    <option value={1}>P1 (High)</option>
                    <option value={2}>P2 (Medium)</option>
                    <option value={3}>P3 (Low)</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          <!-- Organization Section -->
          <section>
            <h3 class="text-xs uppercase font-medium text-foreground-muted mb-3 tracking-wide">
              Organization
            </h3>
            <div class="space-y-4">
              <!-- Epic Select -->
              <div>
                <Label for="epic" class="text-metadata mb-2 block">Epic</Label>
                {#if issue?.parent_issue_id}
                  <!-- Sub-issue: Show epic but don't allow changes -->
                  <div
                    class="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm items-center"
                  >
                    <span class="text-foreground-muted">
                      {projectEpics.find((e) => e.id === localEpicId)?.name}
                      <span class="text-metadata ml-1">(inherited from parent)</span>
                    </span>
                  </div>
                {:else}
                  <!-- Top-level issue: Allow epic changes -->
                  <select
                    id="epic"
                    bind:value={localEpicId}
                    onchange={handleEpicChange}
                    disabled={loading}
                    class="flex min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {#each projectEpics as epic (epic.id)}
                      <option value={epic.id}>{epic.name}</option>
                    {/each}
                  </select>
                {/if}
              </div>

              <!-- Milestone Picker -->
              <div>
                <Label for="milestone" class="text-metadata mb-2 block">Milestone</Label>
                <MilestonePicker
                  selectedMilestoneId={localMilestoneId}
                  {milestones}
                  issues={projectIssues}
                  disabled={loading}
                  onChange={(id) => {
                    localMilestoneId = id;
                    autoSave('milestone_id', id);
                  }}
                />
              </div>
            </div>
          </section>

          <!-- Estimation Section -->
          <section>
            <h3 class="text-xs uppercase font-medium text-foreground-muted mb-3 tracking-wide">
              Estimation
            </h3>
            <div>
              <Label for="story_points" class="text-metadata mb-2 block">Story Points</Label>
              <select
                id="story_points"
                inputmode="numeric"
                value={localStoryPoints?.toString() ?? 'null'}
                onchange={handleStoryPointsChange}
                disabled={loading}
                class="flex min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="null">Not set</option>
                {#each ALLOWED_STORY_POINTS as points (points)}
                  <option value={points.toString()}>{points}</option>
                {/each}
              </select>
            </div>
          </section>

          <!-- Dependencies Section -->
          {#if issue}
            <DependencyManagementSection
              {issue}
              {projectIssues}
              {blockedByIssues}
              {blockingIssues}
              bind:saveError
            />

            <!-- Sub-issues Section -->
            <section>
              <h3 class="text-xs uppercase font-medium text-foreground-muted mb-3 tracking-wide">
                Sub-issues
              </h3>

              <div class="space-y-2">
                <!-- Sub-issues List -->
                {#if subIssues.length > 0}
                  {#each subIssues as subIssue (subIssue.id)}
                    <button
                      type="button"
                      ondblclick={() => {
                        issue = subIssue;
                        showSubIssueForm = false;
                      }}
                      class="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted w-full text-left transition-colors"
                    >
                      <Badge variant={getStatusVariant(subIssue.status)} class="shrink-0">
                        {formatStatus(subIssue.status)}
                      </Badge>
                      <span class="text-body flex-1 truncate">{subIssue.title}</span>
                    </button>
                  {/each}
                {:else if !showSubIssueForm}
                  <p class="text-metadata text-foreground-muted">No sub-issues</p>
                {/if}

                <!-- Inline Form for Creating Sub-issue -->
                {#if showSubIssueForm}
                  <InlineSubIssueForm
                    parentIssueId={issue.id}
                    epicId={issue.epic_id}
                    projectId={issue.project_id}
                    onCancel={() => (showSubIssueForm = false)}
                    onSuccess={() => (showSubIssueForm = false)}
                  />
                {:else}
                  <Button
                    variant="outline"
                    size="sm"
                    onclick={() => (showSubIssueForm = true)}
                    class="w-full"
                  >
                    Add Sub-issue
                  </Button>
                {/if}
              </div>
            </section>
          {/if}
        </div>
      {/if}
    {/if}
  </SheetContent>
</Sheet>
