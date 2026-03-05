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

  import type {
    Issue,
    Epic,
    Milestone,
    IssueStatus,
    StoryPoints,
    Attachment,
    Link,
  } from '$lib/types';
  import { Sheet, SheetContent, SheetHeader, SheetTitle } from '$lib/components/ui/sheet';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import Maximize2Icon from '@lucide/svelte/icons/maximize-2';
  import Minimize2Icon from '@lucide/svelte/icons/minimize-2';
  import { invalidateAll, goto } from '$app/navigation';
  import { deserialize } from '$app/forms';
  import { getBlockingDependencies } from '$lib/utils/issue-helpers';
  import { ALLOWED_STORY_POINTS } from '$lib/utils/issue-helpers';
  import {
    getStatusBadgeVariant,
    formatStatus,
    getEpicStatusVariant,
  } from '$lib/utils/design-tokens';
  import ProgressBar from '$lib/components/ProgressBar.svelte';
  import { computeIssueCounts, computeProgress } from '$lib/utils/issue-counts';
  import DependencyManagementSection from '$lib/components/DependencyManagementSection.svelte';
  import LoadingOverlay from '$lib/components/LoadingOverlay.svelte';
  import MilestonePicker from '$lib/components/MilestonePicker.svelte';
  import RichTextEditor from '$lib/components/RichTextEditor.svelte';
  import AttachmentList from '$lib/components/AttachmentList.svelte';
  import LinkList from '$lib/components/LinkList.svelte';
  import { supabase } from '$lib/supabase';
  import { buildStoragePath } from '$lib/utils/attachment-helpers';
  import { normalizeDescription } from '$lib/utils/text-helpers';
  import { useMediaQuery } from '$lib/hooks/useMediaQuery.svelte';
  import { useKeyboardAwareHeight } from '$lib/hooks/useKeyboardAwareHeight.svelte';
  import { toast } from 'svelte-sonner';
  import { get } from 'svelte/store';
  import { createIssueContext } from '$lib/stores/issues';

  // Props
  let {
    open = $bindable(false),
    mode = 'edit',
    issue = $bindable<Issue | null>(null),
    epics = [],
    milestones = [],
    projectIssues = [],
    projects = [],
    userId = '',
  }: {
    open: boolean;
    mode?: 'edit' | 'create';
    issue: Issue | null;
    epics: Epic[];
    milestones: Milestone[];
    projectIssues: Issue[];
    projects?: { id: string; name: string }[];
    userId?: string;
  } = $props();

  // Local state for form fields
  let localTitle = $state('');
  let localStatus = $state<IssueStatus>('todo');
  let localPriority = $state(2);
  let localStoryPoints = $state<StoryPoints | null>(null);
  let localEpicId = $state('');
  let localMilestoneId = $state<string | null>(null);

  // Loading state
  let loading = $state(false);
  let activeSaveCount = $state(0);
  let latestSaveRequestId = $state(0);

  // Internal mode: can diverge from parent's `mode` prop during create-to-edit transition
  // svelte-ignore state_referenced_locally
  let internalMode = $state<'create' | 'edit'>(mode);

  // Create mode state
  let selectedProjectId = $state('');
  let createLoading = $state(false);
  let createModeInitialized = $state(false);

  // Description state
  let localDescription = $state<string | null>(null);
  let lastPersistedDescriptionNormalized = $state('');
  let descriptionSaveInFlight = $state(false);
  let descriptionInFlightNormalized = $state<string | null>(null);

  // Attachments state
  let attachments = $state<Attachment[]>([]);

  // Links state
  let links = $state<Link[]>([]);

  // Ref for sheet content (keyboard-aware height)
  let sheetContentRef = $state<HTMLElement | null>(null);

  // Track current issue ID to prevent re-initialization on same issue
  let currentIssueId = $state<string | null>(null);

  const successToastA11y = {
    role: 'status',
    'aria-live': 'polite',
  } as const;

  const errorToastA11y = {
    role: 'alert',
    'aria-live': 'assertive',
  } as const;

  // Expand to center peek mode (desktop only)
  let expanded = $state(false);

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
  // Only re-initialize when the issue ID actually changes (not just object reference)
  $effect(() => {
    if (internalMode === 'edit' && issue && issue.id !== currentIssueId) {
      currentIssueId = issue.id;

      localTitle = issue.title;
      localStatus = issue.status;
      localPriority = issue.priority;
      localStoryPoints = issue.story_points;
      localEpicId = issue.epic_id;
      localMilestoneId = issue.milestone_id;

      // CRITICAL: Update prev values to match loaded issue to prevent false change detection
      prevStatus = issue.status;
      prevPriority = issue.priority;
      prevStoryPoints = issue.story_points;
      prevEpicId = issue.epic_id;
      localDescription = issue.description ?? null;
      lastPersistedDescriptionNormalized = normalizeDescription(issue.description);
      descriptionSaveInFlight = false;
      descriptionInFlightNormalized = null;

      // Load attachments and links for this issue
      if (internalMode === 'edit') {
        supabase
          .from('attachments')
          .select('*')
          .eq('entity_type', 'issue')
          .eq('entity_id', issue.id)
          .order('created_at', { ascending: true })
          .then(({ data }) => {
            attachments = data ?? [];
          });
        supabase
          .from('links')
          .select('*')
          .eq('entity_type', 'issue')
          .eq('entity_id', issue.id)
          .order('created_at', { ascending: true })
          .then(({ data }) => {
            links = data ?? [];
          });
      }
    }
  });

  // Initialize create mode defaults ONCE when sheet opens (guard prevents re-running on prop changes)
  $effect(() => {
    if (internalMode === 'create' && open && !createModeInitialized) {
      createModeInitialized = true;
      localTitle = '';
      localStatus = 'todo';
      localPriority = 2;
      localStoryPoints = null;
      localMilestoneId = null;
      const ctx = get(createIssueContext);
      if (ctx) {
        selectedProjectId = ctx.projectId;
        localEpicId = ctx.epicId;
      } else if (projects.length > 0) {
        selectedProjectId = projects[0].id;
      }
    }
  });

  // Auto-select first epic when project changes in create mode
  // Skip if a context already set the epic for this project
  $effect(() => {
    if (internalMode === 'create' && selectedProjectId) {
      const ctx = get(createIssueContext);
      if (ctx && ctx.projectId === selectedProjectId) return;
      const firstEpic = epics.find((e) => e.project_id === selectedProjectId);
      localEpicId = firstEpic?.id ?? '';
    }
  });

  // Reset state when sheet closes
  $effect(() => {
    if (!open) {
      createModeInitialized = false;
      expanded = false;
      selectedProjectId = '';
      localEpicId = '';
      createLoading = false;
      // Reset internal mode back to parent's mode after close animation
      setTimeout(() => {
        internalMode = mode;
      }, 300);
    }
  });

  // Breadcrumb for edit mode header: "ProjectName / E-N EpicName"
  let issueBreadcrumb = $derived.by(() => {
    const currentIssue = issue;
    if (internalMode !== 'edit' || !currentIssue) return null;
    const project = projects.find((p) => p.id === currentIssue.project_id);
    const epic = epics.find((e) => e.id === currentIssue.epic_id);
    if (!project && !epic) return null;
    const parts = [];
    if (project) parts.push(project.name);
    if (epic) parts.push(`E-${epic.number} ${epic.name}`);
    return parts.join(' / ');
  });

  // Filter epics to only show those from the relevant project
  let projectEpics = $derived(
    internalMode === 'create'
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

  // Auto-save function
  async function autoSave(
    field: string,
    value: any,
    options: { onSuccess?: () => void; onFinally?: () => void } = {},
  ) {
    if (!issue || internalMode !== 'edit' || !open) return;

    const requestId = latestSaveRequestId + 1;
    latestSaveRequestId = requestId;
    activeSaveCount += 1;
    loading = activeSaveCount > 0;

    try {
      const formData = new FormData();
      formData.append('id', issue.id);
      formData.append(field, value?.toString() ?? '');

      const response = await fetch('?/updateIssue', {
        method: 'POST',
        body: formData,
      });

      const result = deserialize(await response.text());

      if (result.type === 'success') {
        toast.success('Changes saved successfully', {
          duration: 2000,
          ...successToastA11y,
        });
        options.onSuccess?.();
        await invalidateAll();
      } else {
        const error = (result as any).data?.error || 'Failed to save';
        toast.error(error, {
          duration: 5000,
          ...errorToastA11y,
        });
      }
    } catch (error) {
      console.error('Auto-save error:', error);
      toast.error('Network error - please try again', {
        duration: 5000,
        ...errorToastA11y,
      });
    } finally {
      activeSaveCount = Math.max(0, activeSaveCount - 1);
      loading = activeSaveCount > 0;
      options.onFinally?.();
    }
  }

  // Description change handler (just updates local state)
  function handleDescriptionChange(html: string) {
    localDescription = html;
  }

  // Description blur handler (autosave on blur)
  function handleDescriptionBlur() {
    if (!issue || internalMode !== 'edit' || !open) return;

    const normalizedCurrent = normalizeDescription(localDescription);

    // Don't save if content hasn't changed
    if (normalizedCurrent === lastPersistedDescriptionNormalized) {
      return;
    }

    // Don't save if there's already a save in flight with the same content
    if (descriptionSaveInFlight && descriptionInFlightNormalized === normalizedCurrent) {
      return;
    }

    descriptionSaveInFlight = true;
    descriptionInFlightNormalized = normalizedCurrent;

    autoSave('description', localDescription ?? '', {
      onSuccess: () => {
        lastPersistedDescriptionNormalized = normalizedCurrent;
      },
      onFinally: () => {
        if (descriptionInFlightNormalized === normalizedCurrent) {
          descriptionSaveInFlight = false;
          descriptionInFlightNormalized = null;
        }
      },
    });
  }

  // Inline image upload (goes to public inline-images subfolder)
  async function uploadImage(file: File): Promise<string> {
    if (!userId) throw new Error('User not authenticated');
    const path = `${userId}/inline-images/${crypto.randomUUID()}-${file.name}`;
    const { error } = await supabase.storage.from('attachments').upload(path, file);
    if (error) throw new Error('Failed to upload image');
    const { data } = supabase.storage.from('attachments').getPublicUrl(path);
    return data.publicUrl;
  }

  // File attachment upload (client → storage → server action for metadata)
  async function handleAttachmentUpload(file: File) {
    if (!issue || !userId) return;
    const path = buildStoragePath(userId, 'issue', issue.id, file.name);
    const { error: uploadError } = await supabase.storage.from('attachments').upload(path, file);
    if (uploadError) {
      toast.error('Failed to upload file', {
        duration: 5000,
        ...errorToastA11y,
      });
      return;
    }
    const formData = new FormData();
    formData.append('entity_type', 'issue');
    formData.append('entity_id', issue.id);
    formData.append('file_name', file.name);
    formData.append('file_size', String(file.size));
    formData.append('mime_type', file.type);
    formData.append('storage_path', path);
    const res = await fetch('?/createAttachment', { method: 'POST', body: formData });
    const result = deserialize(await res.text());
    if (result.type === 'success') {
      attachments = [...attachments, (result.data as any).attachment];
    }
  }

  // File attachment delete
  async function handleAttachmentDelete(attachment: Attachment) {
    await supabase.storage.from('attachments').remove([attachment.storage_path]);
    const formData = new FormData();
    formData.append('id', attachment.id);
    await fetch('?/deleteAttachment', { method: 'POST', body: formData });
    attachments = attachments.filter((a) => a.id !== attachment.id);
  }

  // Link add
  async function handleLinkAdd(url: string, label: string) {
    if (!issue) return;
    const formData = new FormData();
    formData.append('entity_type', 'issue');
    formData.append('entity_id', issue.id);
    formData.append('url', url);
    formData.append('label', label);
    const res = await fetch('?/createLink', { method: 'POST', body: formData });
    const result = deserialize(await res.text());
    if (result.type === 'success') {
      links = [...links, (result.data as any).link];
    }
  }

  // Link delete
  async function handleLinkDelete(link: Link) {
    const formData = new FormData();
    formData.append('id', link.id);
    await fetch('?/deleteLink', { method: 'POST', body: formData });
    links = links.filter((l) => l.id !== link.id);
  }

  // Create issue form submission
  async function handleCreateSubmit(event: Event) {
    event.preventDefault();

    if (!localTitle.trim()) {
      toast.error('Issue title is required', {
        duration: 5000,
        ...errorToastA11y,
      });
      return;
    }
    if (!selectedProjectId || !localEpicId) {
      toast.error('Project and epic are required', {
        duration: 5000,
        ...errorToastA11y,
      });
      return;
    }

    createLoading = true;

    try {
      const formData = new FormData();
      formData.append('title', localTitle.trim());
      formData.append('projectId', selectedProjectId);
      formData.append('epicId', localEpicId);

      const response = await fetch('?/createIssue', {
        method: 'POST',
        body: formData,
      });

      const result = deserialize(await response.text());

      if (result.type === 'success') {
        const newIssue = (result.data as any).issue;

        // Set issue with empty relations for edit mode
        issue = {
          ...newIssue,
          blocked_by: [],
          blocking: [],
        };
        currentIssueId = newIssue.id;

        // Transition to edit mode
        internalMode = 'edit';

        await invalidateAll();

        toast.success('Issue created', {
          duration: 2000,
          ...successToastA11y,
        });
      } else {
        toast.error((result as any).data?.error || 'Failed to create issue', {
          duration: 5000,
          ...errorToastA11y,
        });
      }
    } catch (error) {
      console.error('Create issue error:', error);
      toast.error('Network error - please try again', {
        duration: 5000,
        ...errorToastA11y,
      });
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
  }

  function handleTitleBlur() {
    if (!issue || internalMode !== 'edit' || !open) return;
    if (localTitle !== issue.title) {
      autoSave('title', localTitle);
    }
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
    if (
      internalMode === 'edit' &&
      open &&
      issue &&
      localStatus !== prevStatus &&
      localStatus !== issue.status
    ) {
      autoSave('status', localStatus);
      prevStatus = localStatus;
    }
  });

  $effect(() => {
    if (
      internalMode === 'edit' &&
      open &&
      issue &&
      localPriority !== prevPriority &&
      localPriority !== issue.priority
    ) {
      autoSave('priority', localPriority);
      prevPriority = localPriority;
    }
  });

  $effect(() => {
    if (
      internalMode === 'edit' &&
      open &&
      issue &&
      localStoryPoints !== prevStoryPoints &&
      localStoryPoints !== issue.story_points
    ) {
      autoSave('story_points', localStoryPoints);
      prevStoryPoints = localStoryPoints;
    }
  });

  $effect(() => {
    if (
      internalMode === 'edit' &&
      open &&
      issue &&
      localEpicId !== prevEpicId &&
      localEpicId !== issue.epic_id
    ) {
      autoSave('epic_id', localEpicId);
      prevEpicId = localEpicId;
    }
  });
</script>

<Sheet bind:open>
  <SheetContent
    bind:ref={sheetContentRef}
    side={sheetSide}
    {expanded}
    class={expanded && isDesktop() ? 'p-6' : sheetClass}
    onOpenChange={(isOpen) => {
      open = isOpen;
    }}
  >
    {#if internalMode === 'create' || issue}
      <!-- Loading overlay -->
      {#if loading || createLoading}
        <LoadingOverlay />
      {/if}

      <!-- Header -->
      <SheetHeader class="mb-6">
        {#if issueBreadcrumb}
          <p class="text-xs text-muted-foreground mb-1 truncate">{issueBreadcrumb}</p>
        {/if}
        <div class="flex items-start justify-between gap-2">
          <SheetTitle class="font-accent text-page-title flex-1 min-w-0 flex items-baseline gap-0">
            {#if internalMode === 'create'}
              New Issue
            {:else if issue}
              <span class="text-muted-foreground font-mono text-base shrink-0"
                >I-{issue.number}</span
              >
              <span class="mx-2 text-muted-foreground shrink-0">·</span>
              <span>{issue.title}</span>
            {:else}
              Edit Issue
            {/if}
          </SheetTitle>
          {#if isDesktop()}
            <button
              onclick={() => (expanded = !expanded)}
              aria-label={expanded ? 'Collapse to sidebar' : 'Expand to full page'}
              class="shrink-0 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 text-foreground-muted hover:text-foreground mt-1 mr-8"
            >
              {#if expanded}
                <Minimize2Icon class="size-4" />
              {:else}
                <Maximize2Icon class="size-4" />
              {/if}
            </button>
          {/if}
        </div>
      </SheetHeader>

      {#if internalMode === 'create'}
        <!-- Create mode: form with submit button -->
        <form onsubmit={handleCreateSubmit} class="space-y-6 pb-6">
          <!-- Basic Info Section -->
          <section>
            <h3 class="section-header">Basic Info</h3>
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
            <h3 class="section-header">Organization</h3>
            <div class="space-y-4">
              <!-- Project Select -->
              <div>
                <Label for="project" class="text-metadata mb-2 block">Project</Label>
                <select
                  id="project"
                  bind:value={selectedProjectId}
                  required
                  disabled={createLoading}
                  class="select-input"
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
                  class="select-input"
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
        <div class="space-y-4 pb-6">
          <!-- Basic Info Section -->
          <section>
            <div class="space-y-2">
              <!-- Title -->
              <div class="flex items-center gap-3">
                <label for="title" class="text-xs text-foreground-muted w-20 shrink-0">Title</label>
                <Input
                  id="title"
                  name="title"
                  value={localTitle}
                  oninput={handleTitleChange}
                  onblur={handleTitleBlur}
                  required
                  disabled={loading}
                  class="text-body h-8 flex-1"
                />
              </div>

              <!-- Status -->
              <div class="flex items-center gap-3">
                <label for="status" class="text-xs text-foreground-muted w-20 shrink-0"
                  >Status</label
                >
                <select
                  id="status"
                  bind:value={localStatus}
                  onchange={handleStatusChange}
                  disabled={loading}
                  class="select-input-sm"
                >
                  <option value="backlog">Backlog</option>
                  <option value="todo">Todo</option>
                  <option value="in_progress">In Progress</option>
                  <option value="in_review">In Review</option>
                  <option value="done">Done</option>
                  <option value="canceled">Canceled</option>
                </select>
              </div>

              <!-- Priority -->
              <div class="flex items-center gap-3">
                <label for="priority" class="text-xs text-foreground-muted w-20 shrink-0"
                  >Priority</label
                >
                <select
                  id="priority"
                  bind:value={localPriority}
                  onchange={handlePriorityChange}
                  disabled={loading}
                  class="select-input-sm"
                >
                  <option value={0}>P0 (Critical)</option>
                  <option value={1}>P1 (High)</option>
                  <option value={2}>P2 (Medium)</option>
                  <option value={3}>P3 (Low)</option>
                </select>
              </div>

              <!-- Milestone -->
              <div class="flex items-center gap-3">
                <label for="milestone" class="text-xs text-foreground-muted w-20 shrink-0"
                  >Milestone</label
                >
                <div class="flex-1">
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

              <!-- Story Points -->
              <div class="flex items-center gap-3">
                <label for="story_points" class="text-xs text-foreground-muted w-20 shrink-0"
                  >Points</label
                >
                <select
                  id="story_points"
                  value={localStoryPoints?.toString() ?? 'null'}
                  onchange={handleStoryPointsChange}
                  disabled={loading}
                  class="select-input-sm"
                >
                  <option value="null">Not set</option>
                  {#each ALLOWED_STORY_POINTS as points (points)}
                    <option value={points.toString()}>{points}</option>
                  {/each}
                </select>
              </div>
            </div>
          </section>

          <!-- Description Section -->
          <section>
            <h3 class="section-header">Description</h3>
            <RichTextEditor
              content={localDescription}
              onchange={handleDescriptionChange}
              onblur={handleDescriptionBlur}
              {uploadImage}
              disabled={loading}
            />
          </section>

          <!-- Attachments Section -->
          <section>
            <h3 class="section-header">Attachments</h3>
            <AttachmentList
              {attachments}
              onUpload={handleAttachmentUpload}
              onDelete={handleAttachmentDelete}
              disabled={loading}
            />
          </section>

          <!-- Links Section -->
          <section>
            <h3 class="section-header">Links</h3>
            <LinkList
              {links}
              onAdd={handleLinkAdd}
              onDelete={handleLinkDelete}
              disabled={loading}
            />
          </section>

          <!-- Dependencies Section -->
          {#if issue}
            <DependencyManagementSection
              {issue}
              {projectIssues}
              {blockedByIssues}
              {blockingIssues}
            />
          {/if}
        </div>
      {/if}
    {/if}
  </SheetContent>
</Sheet>
