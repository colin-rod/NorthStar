<script lang="ts">
  import type { Project, Epic, Attachment } from '$lib/types';
  import type { IssueCounts } from '$lib/utils/issue-counts';
  import type { ProjectMetrics } from '$lib/utils/project-helpers';
  import { computeProgress } from '$lib/utils/issue-counts';
  import { Sheet, SheetContent, SheetHeader, SheetTitle } from '$lib/components/ui/sheet';
  import { Input } from '$lib/components/ui/input';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import Maximize2Icon from '@lucide/svelte/icons/maximize-2';
  import Minimize2Icon from '@lucide/svelte/icons/minimize-2';
  import { invalidateAll } from '$app/navigation';
  import { deserialize } from '$app/forms';
  import RichTextEditor from '$lib/components/RichTextEditor.svelte';
  import AttachmentList from '$lib/components/AttachmentList.svelte';
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
  }

  let {
    open = $bindable(false),
    mode = 'edit',
    project,
    counts,
    metrics,
    epics,
    userId = '',
  }: Props = $props();

  // Internal mode: can diverge from parent's `mode` prop during create-to-edit transition
  let internalMode = $state<'create' | 'edit'>(mode);
  let internalProject = $state<Project | null>(null);
  let effectiveProject = $derived(internalProject ?? project);

  let localName = $state('');
  let localDescription = $state<string | null>(null);
  let localStatus = $state<'active' | 'done' | 'canceled'>('active');
  let attachments = $state<Attachment[]>([]);
  let createLoading = $state(false);
  let sheetContentRef = $state<HTMLElement | null>(null);
  let lastPersistedDescriptionNormalized = $state('');
  type SaveState = 'idle' | 'saving' | 'saved' | 'error';
  let saveState = $state<SaveState>('idle');
  let saveStateResetTimeout: ReturnType<typeof setTimeout> | null = null;
  let latestSaveRequestId = $state(0);

  // Expand to center peek mode (desktop only)
  let expanded = $state(false);

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

      // Load attachments for this project
      supabase
        .from('attachments')
        .select('*')
        .eq('entity_type', 'project')
        .eq('entity_id', effectiveProject.id)
        .order('created_at', { ascending: true })
        .then(({ data }) => {
          attachments = data ?? [];
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
        toast.success('Changes saved successfully', {
          duration: 2000,
        });
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
    const value = (event.target as HTMLSelectElement).value as 'active' | 'done' | 'canceled';
    localStatus = value;
    autoSave('status', value);
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

  const getEpicStatusVariant = (status: string) => {
    if (status === 'active') return 'default';
    if (status === 'done') return 'status-done';
    return 'status-canceled';
  };
</script>

<Sheet bind:open>
  <SheetContent
    side={sheetSide}
    {expanded}
    class={expanded && isDesktop() ? 'p-6' : sheetClass}
    bind:ref={sheetContentRef}
  >
    {#if internalMode === 'create' || effectiveProject}
      <!-- Loading overlay -->
      {#if createLoading}
        <div
          class="absolute inset-0 bg-background/50 flex items-center justify-center z-50 rounded-t-lg"
        >
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      {/if}

      <SheetHeader class="mb-6">
        <div class="flex items-start justify-between gap-2">
          <SheetTitle
            class="text-xs uppercase font-medium text-foreground-muted tracking-wide flex-1 min-w-0"
          >
            {#if internalMode === 'create'}
              New Project
            {:else if effectiveProject}
              P-{effectiveProject.number} · Project
            {:else}
              Project
            {/if}
          </SheetTitle>
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
          <div aria-live="polite" class="text-metadata text-foreground-muted min-h-4">
            {#if saveState === 'saving'}
              Saving...
            {:else if saveState === 'saved'}
              ✓ Saved
            {:else if saveState === 'error'}
              Save failed. Please retry.
            {/if}
          </div>

          <!-- Name -->
          <section>
            <h3 class="text-xs uppercase font-medium text-foreground-muted mb-2 tracking-wide">
              Name
            </h3>
            <Input
              value={localName}
              oninput={handleNameInput}
              onblur={handleNameBlur}
              placeholder="Project name"
              class="text-body"
            />
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
                <option value="active">Active</option>
                <option value="done">Done</option>
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

          <!-- Stats -->
          {#if metrics}
            <section>
              <h3 class="text-xs uppercase font-medium text-foreground-muted mb-3 tracking-wide">
                Stats
              </h3>
              <div class="grid grid-cols-3 gap-3 text-metadata">
                <div class="flex flex-col gap-1">
                  <span class="text-lg font-semibold">{metrics.totalIssues}</span>
                  <span class="text-foreground-secondary">Issues</span>
                </div>
                <div class="flex flex-col gap-1">
                  <span class="text-lg font-semibold">{epics.length}</span>
                  <span class="text-foreground-secondary">Epics</span>
                </div>
                <div class="flex flex-col gap-1">
                  <span class="text-lg font-semibold">{metrics.activeStoryPoints}</span>
                  <span class="text-foreground-secondary">Active SP</span>
                </div>
                <div class="flex flex-col gap-1">
                  <span class="text-lg font-semibold">{metrics.totalStoryPoints}</span>
                  <span class="text-foreground-secondary">Total SP</span>
                </div>
              </div>
            </section>
          {/if}

          <!-- Progress -->
          {#if counts}
            <section>
              <h3 class="text-xs uppercase font-medium text-foreground-muted mb-3 tracking-wide">
                Progress
              </h3>
              <div class="grid grid-cols-3 gap-3 text-metadata">
                <div class="flex items-center gap-2">
                  <Badge variant="default" class="text-xs">{counts.ready}</Badge>
                  <span class="text-foreground-secondary">Ready</span>
                </div>
                <div class="flex items-center gap-2">
                  <Badge variant="status-doing" class="text-xs">{counts.doing}</Badge>
                  <span class="text-foreground-secondary">Doing</span>
                </div>
                <div class="flex items-center gap-2">
                  <Badge variant="status-in-review" class="text-xs">{counts.inReview}</Badge>
                  <span class="text-foreground-secondary">In Review</span>
                </div>
                <div class="flex items-center gap-2">
                  <Badge variant="status-blocked" class="text-xs">{counts.blocked}</Badge>
                  <span class="text-foreground-secondary">Blocked</span>
                </div>
                <div class="flex items-center gap-2">
                  <Badge variant="status-done" class="text-xs">{counts.done}</Badge>
                  <span class="text-foreground-secondary">Done</span>
                </div>
                <div class="flex items-center gap-2">
                  <Badge variant="status-canceled" class="text-xs">{counts.canceled}</Badge>
                  <span class="text-foreground-secondary">Canceled</span>
                </div>
              </div>
              {#if computeProgress(counts).total > 0}
                <div class="mt-3 flex items-center gap-2">
                  <div
                    class="flex-1 h-[3px] bg-muted rounded-full overflow-hidden"
                    role="progressbar"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-valuenow={Math.max(
                      0,
                      Math.min(100, Number(computeProgress(counts).percentage) || 0),
                    )}
                    aria-label="Project completion progress"
                  >
                    <div
                      class="h-full bg-foreground/40 rounded-full transition-all duration-300"
                      style="width: {computeProgress(counts).percentage}%"
                    ></div>
                  </div>
                  <span class="text-metadata text-foreground-secondary shrink-0">
                    {computeProgress(counts).percentage}%
                  </span>
                </div>
              {/if}
            </section>
          {/if}

          <!-- Epics -->
          {#if epics.length > 0}
            <section>
              <h3 class="text-xs uppercase font-medium text-foreground-muted mb-3 tracking-wide">
                Epics
              </h3>
              <div class="space-y-2">
                {#each epics as epic (epic.id)}
                  <div class="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                    <Badge variant={getEpicStatusVariant(epic.status)} class="text-xs shrink-0">
                      {epic.status}
                    </Badge>
                    <span class="text-body flex-1 truncate">{epic.name}</span>
                  </div>
                {/each}
              </div>
            </section>
          {/if}
        </div>
      {/if}
    {/if}
  </SheetContent>
</Sheet>
