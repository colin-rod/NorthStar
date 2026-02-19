<script lang="ts">
  import type { Project, Epic, Attachment } from '$lib/types';
  import type { IssueCounts } from '$lib/utils/issue-counts';
  import type { ProjectMetrics } from '$lib/utils/project-helpers';
  import { computeProgress } from '$lib/utils/issue-counts';
  import { Sheet, SheetContent, SheetHeader, SheetTitle } from '$lib/components/ui/sheet';
  import { Input } from '$lib/components/ui/input';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { invalidateAll } from '$app/navigation';
  import RichTextEditor from '$lib/components/RichTextEditor.svelte';
  import AttachmentList from '$lib/components/AttachmentList.svelte';
  import { supabase } from '$lib/supabase';
  import { buildStoragePath } from '$lib/utils/attachment-helpers';
  import { useMediaQuery } from '$lib/hooks/useMediaQuery.svelte';
  import { useKeyboardAwareHeight } from '$lib/hooks/useKeyboardAwareHeight.svelte';

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

  let localName = $state('');
  let localDescription = $state<string | null>(null);
  let attachments = $state<Attachment[]>([]);
  let saveError = $state<string | null>(null);
  let saveSuccess = $state(false);
  let createLoading = $state(false);
  let sheetContentRef = $state<HTMLElement | null>(null);

  let titleDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  let descriptionDebounceTimer: ReturnType<typeof setTimeout> | null = null;

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
    if (mode === 'edit' && project) {
      localName = project.name;
      if (!descriptionDebounceTimer) {
        localDescription = project.description ?? null;
      }
      saveError = null;
      saveSuccess = false;

      // Load attachments for this project
      supabase
        .from('attachments')
        .select('*')
        .eq('entity_type', 'project')
        .eq('entity_id', project.id)
        .order('created_at', { ascending: true })
        .then(({ data }) => {
          attachments = data ?? [];
        });
    }
  });

  // Initialize create mode defaults when sheet opens
  $effect(() => {
    if (mode === 'create' && open) {
      localName = '';
      localDescription = null;
      attachments = [];
      saveError = null;
      createLoading = false;
    }
  });

  // Reset create mode state when sheet closes
  $effect(() => {
    if (!open && mode === 'create') {
      createLoading = false;
    }
  });

  async function autoSave(field: string, value: string) {
    if (!project) return;

    saveError = null;
    saveSuccess = false;

    try {
      const formData = new FormData();
      formData.append('id', project.id);
      formData.append(field, value);

      const response = await fetch('?/updateProject', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.type === 'success') {
        await invalidateAll();
        saveSuccess = true;
        setTimeout(() => {
          saveSuccess = false;
        }, 2000);
      } else {
        saveError = result.data?.error || 'Failed to save';
        setTimeout(() => {
          saveError = null;
        }, 5000);
      }
    } catch {
      saveError = 'Network error - please try again';
      setTimeout(() => {
        saveError = null;
      }, 5000);
    }
  }

  function handleNameInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    localName = value;

    if (titleDebounceTimer) clearTimeout(titleDebounceTimer);
    titleDebounceTimer = setTimeout(() => {
      autoSave('name', value.trim());
    }, 500);
  }

  function handleDescriptionChange(html: string) {
    localDescription = html;
    if (descriptionDebounceTimer) clearTimeout(descriptionDebounceTimer);
    descriptionDebounceTimer = setTimeout(() => {
      autoSave('description', localDescription ?? '');
    }, 1000);
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
    if (!project || !userId) return;
    const path = buildStoragePath(userId, 'project', project.id, file.name);
    const { error: uploadError } = await supabase.storage.from('attachments').upload(path, file);
    if (uploadError) {
      saveError = 'Failed to upload file';
      setTimeout(() => {
        saveError = null;
      }, 5000);
      return;
    }
    const formData = new FormData();
    formData.append('entity_type', 'project');
    formData.append('entity_id', project.id);
    formData.append('file_name', file.name);
    formData.append('file_size', String(file.size));
    formData.append('mime_type', file.type);
    formData.append('storage_path', path);
    const res = await fetch('?/createAttachment', { method: 'POST', body: formData });
    const result = await res.json();
    if (res.ok && result.type === 'success') {
      attachments = [...attachments, result.data.attachment];
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
      saveError = 'Project name is required';
      return;
    }

    createLoading = true;
    saveError = null;

    try {
      const formData = new FormData();
      formData.append('name', localName.trim());
      if (localDescription) {
        formData.append('description', localDescription);
      }

      const response = await fetch('?/createProject', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.type === 'success') {
        await invalidateAll();
        open = false;
      } else {
        saveError = result.data?.error || 'Failed to create project';
      }
    } catch (error) {
      console.error('Create project error:', error);
      saveError = 'Network error - please try again';
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
  <SheetContent side={sheetSide} class={sheetClass} bind:ref={sheetContentRef}>
    {#if mode === 'create' || project}
      <!-- Loading overlay -->
      {#if createLoading}
        <div
          class="absolute inset-0 bg-background/50 flex items-center justify-center z-50 rounded-t-lg"
        >
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      {/if}

      <SheetHeader class="mb-6">
        <SheetTitle class="text-xs uppercase font-medium text-foreground-muted tracking-wide">
          {#if mode === 'create'}
            New Project
          {:else if project}
            P-{project.number} · Project
          {:else}
            Project
          {/if}
        </SheetTitle>
      </SheetHeader>

      {#if mode === 'create'}
        <!-- Create mode: form with submit button -->
        <form onsubmit={handleCreateSubmit} class="space-y-6 pb-6">
          <!-- Error message -->
          {#if saveError}
            <div
              class="p-3 rounded-md bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 text-sm"
            >
              {saveError}
            </div>
          {/if}

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

          <!-- Description -->
          <section>
            <h3 class="text-xs uppercase font-medium text-foreground-muted mb-2 tracking-wide">
              Description
            </h3>
            <RichTextEditor
              content={localDescription}
              onchange={(html) => {
                localDescription = html;
              }}
              {uploadImage}
              disabled={createLoading}
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
          <!-- Name -->
          <section>
            <h3 class="text-xs uppercase font-medium text-foreground-muted mb-2 tracking-wide">
              Name
            </h3>
            <Input
              value={localName}
              oninput={handleNameInput}
              placeholder="Project name"
              class="text-body"
            />
          </section>

          <!-- Description -->
          <section>
            <h3 class="text-xs uppercase font-medium text-foreground-muted mb-2 tracking-wide">
              Description
            </h3>
            <RichTextEditor
              content={localDescription}
              onchange={handleDescriptionChange}
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
                  <div class="flex-1 h-[3px] bg-muted rounded-full overflow-hidden">
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

          <!-- Save feedback -->
          {#if saveError}
            <p class="text-sm text-destructive">{saveError}</p>
          {/if}
          {#if saveSuccess}
            <p class="text-sm text-foreground-secondary">Saved</p>
          {/if}
        </div>
      {/if}
    {/if}
  </SheetContent>
</Sheet>
