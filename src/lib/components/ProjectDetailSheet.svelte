<script lang="ts">
  import type { Project, Epic, Attachment, Link, ProjectStatus } from '$lib/types';
  import ProjectIconPicker from '$lib/components/ProjectIconPicker.svelte';
  import type { ProjectColor } from '$lib/utils/project-colors';
  import type { ProjectIconKey } from '$lib/utils/project-icons';
  import type { IssueCounts } from '$lib/utils/issue-counts';
  import type { ProjectMetrics } from '$lib/utils/project-helpers';
  import { computeIssueCounts, computeProgress } from '$lib/utils/issue-counts';
  import { getEpicStatusVariant, formatStatus } from '$lib/utils/design-tokens';
  import { copyDeepLink } from '$lib/utils/url-helpers';
  import { Sheet, SheetContent, SheetHeader, SheetTitle } from '$lib/components/ui/sheet';
  import { Input } from '$lib/components/ui/input';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import Maximize2Icon from '@lucide/svelte/icons/maximize-2';
  import Minimize2Icon from '@lucide/svelte/icons/minimize-2';
  import CheckIcon from '@lucide/svelte/icons/check';
  import Link2Icon from '@lucide/svelte/icons/link-2';
  import AlertCircleIcon from '@lucide/svelte/icons/alert-circle';
  import LoaderIcon from '@lucide/svelte/icons/loader';
  import { Skeleton } from '$lib/components/ui/skeleton';
  import { invalidateAll } from '$app/navigation';
  import { deserialize } from '$app/forms';
  import RichTextEditor from '$lib/components/RichTextEditor.svelte';
  import AttachmentList from '$lib/components/AttachmentList.svelte';
  import LinkList from '$lib/components/LinkList.svelte';
  import ProgressBar from '$lib/components/ProgressBar.svelte';
  import IssueCountsBadges from '$lib/components/IssueCountsBadges.svelte';
  import LoadingOverlay from '$lib/components/LoadingOverlay.svelte';
  import { supabase } from '$lib/supabase';
  import { buildStoragePath } from '$lib/utils/attachment-helpers';
  import { normalizeDescription } from '$lib/utils/text-helpers';
  import { useMediaQuery } from '$lib/hooks/useMediaQuery.svelte';
  import { useKeyboardAwareHeight } from '$lib/hooks/useKeyboardAwareHeight.svelte';
  import { toast } from 'svelte-sonner';

  interface Props {
    open: boolean;
    mode?: 'create' | 'edit';
    project: Project | null;
    counts: IssueCounts | null;
    metrics: ProjectMetrics | null;
    epics: Epic[];
    userId?: string;
    onEpicClick?: (epic: Epic) => void;
    onAddEpic?: () => void;
  }

  let {
    open = $bindable(false),
    mode = 'edit',
    project,
    counts,
    metrics,
    epics,
    userId = '',
    onEpicClick,
    onAddEpic,
  }: Props = $props();

  // Internal mode: can diverge from parent's `mode` prop during create-to-edit transition
  let internalMode = $state<'create' | 'edit'>((() => mode)());
  let internalProject = $state<Project | null>(null);
  let effectiveProject = $derived(internalProject ?? project);

  let localName = $state('');
  let localDescription = $state<string | null>(null);
  let localStatus = $state<ProjectStatus>('active');
  let attachments = $state<Attachment[]>([]);
  let links = $state<Link[]>([]);
  let createLoading = $state(false);
  let sheetContentRef = $state<HTMLElement | null>(null);
  let lastPersistedDescriptionNormalized = $state('');
  type SaveState = 'idle' | 'saving' | 'saved' | 'error';
  let saveState = $state<SaveState>('idle');
  let saveStateResetTimeout: ReturnType<typeof setTimeout> | null = null;
  let latestSaveRequestId = $state(0);

  // Expand to center peek mode (desktop only)
  let expanded = $state(false);

  // Copy link feedback
  let copied = $state(false);
  async function handleCopyLink() {
    if (!effectiveProject) return;
    await copyDeepLink({ projectId: effectiveProject.id });
    copied = true;
    setTimeout(() => (copied = false), 1500);
  }

  const isDesktop = useMediaQuery('(min-width: 768px)');
  let sheetSide = $derived<'right' | 'bottom'>(isDesktop() ? 'right' : 'bottom');
  let sheetClass = $derived(
    isDesktop() ? 'w-[480px] h-screen overflow-y-auto p-6' : 'overflow-y-auto relative',
  );

  $effect(() => {
    if (!isDesktop() && sheetContentRef) {
      useKeyboardAwareHeight(sheetContentRef);
    }
  });

  // Initialize local state when project changes (edit mode)
  $effect(() => {
    if (internalMode === 'edit' && effectiveProject) {
      localName = effectiveProject.name;
      localDescription = effectiveProject.description ?? null;
      localStatus = effectiveProject.status ?? 'active';
      lastPersistedDescriptionNormalized = normalizeDescription(effectiveProject.description);
      saveState = 'idle';

      // Load attachments and links for this project
      supabase
        .from('attachments')
        .select('*')
        .eq('entity_type', 'project')
        .eq('entity_id', effectiveProject.id)
        .order('created_at', { ascending: true })
        .then(({ data }) => {
          attachments = data ?? [];
        });
      supabase
        .from('links')
        .select('*')
        .eq('entity_type', 'project')
        .eq('entity_id', effectiveProject.id)
        .order('created_at', { ascending: true })
        .then(({ data }) => {
          links = data ?? [];
        });
    }
  });

  // Initialize create mode defaults when sheet opens
  $effect(() => {
    if (internalMode === 'create' && open) {
      localName = '';
      localDescription = null;
      attachments = [];
      createLoading = false;
      saveState = 'idle';
      if (saveStateResetTimeout) {
        clearTimeout(saveStateResetTimeout);
        saveStateResetTimeout = null;
      }
    }
  });

  // Reset state when sheet closes
  $effect(() => {
    if (!open) {
      expanded = false;
      createLoading = false;
      saveState = 'idle';
      if (saveStateResetTimeout) {
        clearTimeout(saveStateResetTimeout);
        saveStateResetTimeout = null;
      }
      // Reset internal mode and created project after close animation
      setTimeout(() => {
        internalMode = mode;
        internalProject = null;
      }, 300);
    }
  });

  function clearSaveStateResetTimeout() {
    if (saveStateResetTimeout) {
      clearTimeout(saveStateResetTimeout);
      saveStateResetTimeout = null;
    }
  }

  function queueSaveStateIdleReset() {
    clearSaveStateResetTimeout();
    saveStateResetTimeout = setTimeout(() => {
      if (saveState === 'saved') {
        saveState = 'idle';
      }
      saveStateResetTimeout = null;
    }, 1500);
  }

  async function autoSave(field: string, value: string) {
    if (!effectiveProject || internalMode !== 'edit' || !open) return;

    const requestId = latestSaveRequestId + 1;
    latestSaveRequestId = requestId;
    clearSaveStateResetTimeout();
    saveState = 'saving';

    try {
      const formData = new FormData();
      formData.append('id', effectiveProject!.id);
      formData.append(field, value);

      const response = await fetch('?/updateProject', {
        method: 'POST',
        body: formData,
      });

      const result = deserialize(await response.text());

      if (result.type === 'success') {
        if (requestId === latestSaveRequestId) {
          saveState = 'saved';
          queueSaveStateIdleReset();
        }
        await invalidateAll();
      } else {
        if (requestId === latestSaveRequestId) {
          saveState = 'error';
        }
        toast.error((result as any).data?.error || 'Failed to save', {
          duration: 5000,
        });
      }
    } catch {
      if (requestId === latestSaveRequestId) {
        saveState = 'error';
      }
      toast.error('Network error - please try again', {
        duration: 5000,
      });
    }
  }

  function handleNameInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    localName = value;
  }

  function handleNameBlur() {
    if (!effectiveProject || internalMode !== 'edit' || !open) return;
    if (localName.trim() !== effectiveProject.name) {
      autoSave('name', localName.trim());
    }
  }

  function handleStatusChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value as ProjectStatus;
    localStatus = value;
    autoSave('status', value);
  }

  function handleColorChange(color: ProjectColor) {
    autoSave('color', color);
  }

  function handleIconChange(icon: ProjectIconKey) {
    autoSave('icon', icon);
  }

  function handleDescriptionChange(html: string) {
    localDescription = html;
  }

  function handleDescriptionBlur() {
    if (!effectiveProject || internalMode !== 'edit' || !open) return;

    const normalizedCurrent = normalizeDescription(localDescription);
    if (normalizedCurrent === lastPersistedDescriptionNormalized) {
      return;
    }

    autoSave('description', localDescription ?? '');
    lastPersistedDescriptionNormalized = normalizedCurrent;
  }

  async function uploadImage(file: File): Promise<string> {
    if (!userId) throw new Error('User not authenticated');
    const path = `${userId}/inline-images/${crypto.randomUUID()}-${file.name}`;
    const { error } = await supabase.storage.from('attachments').upload(path, file);
    if (error) throw new Error('Failed to upload image');
    const { data } = supabase.storage.from('attachments').getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleAttachmentUpload(file: File) {
    if (!effectiveProject || !userId) return;
    const path = buildStoragePath(userId, 'project', effectiveProject.id, file.name);
    const { error: uploadError } = await supabase.storage.from('attachments').upload(path, file);
    if (uploadError) {
      toast.error('Failed to upload file', {
        duration: 5000,
      });
      return;
    }
    const formData = new FormData();
    formData.append('entity_type', 'project');
    formData.append('entity_id', effectiveProject!.id);
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

  async function handleAttachmentDelete(attachment: Attachment) {
    await supabase.storage.from('attachments').remove([attachment.storage_path]);
    const formData = new FormData();
    formData.append('id', attachment.id);
    await fetch('?/deleteAttachment', { method: 'POST', body: formData });
    attachments = attachments.filter((a) => a.id !== attachment.id);
  }

  async function handleLinkAdd(url: string, label: string) {
    if (!effectiveProject) return;
    const formData = new FormData();
    formData.append('entity_type', 'project');
    formData.append('entity_id', effectiveProject.id);
    formData.append('url', url);
    formData.append('label', label);
    const res = await fetch('?/createLink', { method: 'POST', body: formData });
    const result = deserialize(await res.text());
    if (result.type === 'success') {
      links = [...links, (result.data as any).link];
    }
  }

  async function handleLinkDelete(link: Link) {
    const formData = new FormData();
    formData.append('id', link.id);
    await fetch('?/deleteLink', { method: 'POST', body: formData });
    links = links.filter((l) => l.id !== link.id);
  }

  // Create project form submission
  async function handleCreateSubmit(event: Event) {
    event.preventDefault();

    if (!localName.trim()) {
      toast.error('Project name is required', {
        duration: 5000,
      });
      return;
    }

    createLoading = true;

    try {
      const formData = new FormData();
      formData.append('name', localName.trim());

      const response = await fetch('?/createProject', {
        method: 'POST',
        body: formData,
      });

      const result = deserialize(await response.text());

      if (result.type === 'success') {
        const newProject = (result.data as any).project;

        // Transition to edit mode (keep sheet open)
        internalProject = newProject;
        internalMode = 'edit';

        await invalidateAll();
        toast.success('Project created', {
          duration: 2000,
        });
      } else {
        toast.error((result as any).data?.error || 'Failed to create project', {
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Create project error:', error);
      toast.error('Network error - please try again', {
        duration: 5000,
      });
    } finally {
      createLoading = false;
    }
  }
</script>

<Sheet bind:open>
  <SheetContent
    side={sheetSide}
    {expanded}
    class={expanded && isDesktop() ? 'p-6' : sheetClass}
    bind:ref={sheetContentRef}
  >
    {#if open && internalMode === 'edit' && !effectiveProject}
      <!-- Skeleton while project data populates -->
      <div class="space-y-5 pb-6">
        <Skeleton class="h-5 w-2/3" />
        <Skeleton class="h-8 w-full" />
        <Skeleton class="h-8 w-3/4" />
        <Skeleton class="h-24 w-full" />
      </div>
    {:else if internalMode === 'create' || effectiveProject}
      <!-- Loading overlay -->
      {#if createLoading}
        <LoadingOverlay />
      {/if}

      <SheetHeader class="mb-6">
        <div class="flex items-start justify-between gap-2">
          <SheetTitle class="flex-1 min-w-0 flex items-baseline gap-0 text-base font-semibold">
            {#if internalMode === 'create'}
              New Project
            {:else if effectiveProject}
              <span class="text-muted-foreground font-mono text-sm shrink-0"
                >P-{effectiveProject.number}</span
              >
              <span class="mx-2 text-muted-foreground shrink-0">·</span>
              <span class="truncate">{effectiveProject.name}</span>
            {:else}
              Project
            {/if}
          </SheetTitle>
          {#if internalMode === 'edit'}
            {#if saveState === 'saving'}
              <span class="shrink-0 mt-0.5 text-muted-foreground" aria-label="Saving">
                <LoaderIcon class="size-4 animate-spin" />
              </span>
            {:else if saveState === 'saved'}
              <span
                class="shrink-0 mt-0.5 text-green-600 dark:text-green-400 transition-opacity duration-300"
                aria-label="Saved"
              >
                <CheckIcon class="size-4" />
              </span>
            {:else if saveState === 'error'}
              <span class="shrink-0 mt-0.5 text-destructive" aria-label="Save failed">
                <AlertCircleIcon class="size-4" />
              </span>
            {/if}
            <button
              onclick={handleCopyLink}
              aria-label="Copy link to project"
              class="shrink-0 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 text-foreground-muted hover:text-foreground {isDesktop()
                ? ''
                : 'mr-8'}"
            >
              {#if copied}
                <CheckIcon class="size-4" />
              {:else}
                <Link2Icon class="size-4" />
              {/if}
            </button>
          {/if}
          {#if isDesktop()}
            <button
              onclick={() => (expanded = !expanded)}
              aria-label={expanded ? 'Collapse to sidebar' : 'Expand to full page'}
              class="shrink-0 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 text-foreground-muted hover:text-foreground mr-8"
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
          <!-- Name -->
          <section>
            <h3 class="text-xs uppercase font-medium text-foreground-muted mb-2 tracking-wide">
              Name
            </h3>
            <Input
              value={localName}
              oninput={(e) => {
                localName = e.currentTarget.value;
              }}
              required
              disabled={createLoading}
              placeholder="Project name"
              class="text-body"
            />
          </section>

          <!-- Submit Button -->
          <Button type="submit" disabled={createLoading || !localName.trim()} class="w-full">
            {createLoading ? 'Creating...' : 'Create Project'}
          </Button>
        </form>
      {:else}
        <!-- Edit mode: auto-save behavior -->
        <div class="space-y-6 pb-6">
          <!-- Name + Icon -->
          <section>
            <div class="flex items-center gap-3">
              <ProjectIconPicker
                color={effectiveProject?.color ?? null}
                icon={effectiveProject?.icon ?? null}
                onColorChange={handleColorChange}
                onIconChange={handleIconChange}
              />
              <div class="flex flex-col gap-1 flex-1 min-w-0">
                <label
                  for="edit-project-name"
                  class="text-xs uppercase font-medium text-foreground-muted tracking-wide"
                  >Name</label
                >
                <Input
                  id="edit-project-name"
                  value={localName}
                  oninput={handleNameInput}
                  onblur={handleNameBlur}
                  placeholder="Project name"
                  class="text-body"
                />
              </div>
            </div>
          </section>

          <!-- Status -->
          <section>
            <div class="flex items-center gap-3">
              <label for="edit-status" class="text-xs text-foreground-muted w-20 shrink-0"
                >Status</label
              >
              <select
                id="edit-status"
                value={localStatus}
                onchange={handleStatusChange}
                class="flex h-8 flex-1 rounded-md border border-input bg-background px-3 py-1 text-base md:text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="backlog">Backlog</option>
                <option value="planned">Planned</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="canceled">Canceled</option>
              </select>
            </div>
          </section>

          <!-- Description -->
          <section>
            <h3 class="text-xs uppercase font-medium text-foreground-muted mb-2 tracking-wide">
              Description
            </h3>
            <RichTextEditor
              content={localDescription}
              onchange={handleDescriptionChange}
              onblur={handleDescriptionBlur}
              {uploadImage}
            />
          </section>

          <!-- Attachments -->
          <section>
            <h3 class="text-xs uppercase font-medium text-foreground-muted mb-2 tracking-wide">
              Attachments
            </h3>
            <AttachmentList
              {attachments}
              onUpload={handleAttachmentUpload}
              onDelete={handleAttachmentDelete}
            />
          </section>

          <!-- Links -->
          <section>
            <h3 class="text-xs uppercase font-medium text-foreground-muted mb-2 tracking-wide">
              Links
            </h3>
            <LinkList {links} onAdd={handleLinkAdd} onDelete={handleLinkDelete} />
          </section>

          <!-- Stats -->
          {#if metrics}
            <section>
              <h3 class="section-header">Stats</h3>
              <dl class="grid grid-cols-4 gap-3 text-metadata">
                <div class="flex flex-col gap-1">
                  <dd class="text-section-header">{metrics.totalIssues}</dd>
                  <dt class="text-foreground-secondary">Issues</dt>
                </div>
                <div class="flex flex-col gap-1">
                  <dd class="text-section-header">{epics.length}</dd>
                  <dt class="text-foreground-secondary">Epics</dt>
                </div>
                <div class="flex flex-col gap-1">
                  <dd class="text-section-header">{metrics.activeStoryPoints}</dd>
                  <dt class="text-foreground-secondary">Active pts</dt>
                </div>
                <div class="flex flex-col gap-1">
                  <dd class="text-section-header">{metrics.totalStoryPoints}</dd>
                  <dt class="text-foreground-secondary">Total pts</dt>
                </div>
              </dl>
            </section>
          {/if}

          <!-- Progress -->
          {#if counts}
            <section>
              <h3 class="section-header">Progress</h3>
              <IssueCountsBadges {counts} />
              {#if computeProgress(counts).total > 0}
                <div class="mt-3">
                  <ProgressBar
                    percentage={computeProgress(counts).percentage}
                    ariaLabel="Project completion progress"
                  />
                </div>
              {/if}
            </section>
          {/if}

          <!-- Epics -->
          {#if epics.length > 0}
            <section>
              <h3 class="section-header">Epics</h3>
              <div class="space-y-1">
                {#each epics as epic}
                  <button
                    onclick={() => onEpicClick?.(epic)}
                    class="w-full flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors text-left"
                  >
                    <span class="truncate {epic.is_default ? 'text-foreground-secondary' : ''}"
                      >{epic.name}</span
                    >
                    <Badge variant={getEpicStatusVariant(epic.status)} class="shrink-0 text-xs">
                      {formatStatus(epic.status)}
                    </Badge>
                  </button>
                {/each}
              </div>
            </section>
          {/if}
        </div>
      {/if}
    {/if}
  </SheetContent>
</Sheet>
