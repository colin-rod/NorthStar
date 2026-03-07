<script lang="ts">
  import type {
    Epic,
    Attachment,
    Link,
    Milestone,
    Issue,
    IssueStatus,
    EpicStatus,
  } from '$lib/types';
  import type { IssueCounts } from '$lib/utils/issue-counts';
  import { computeProgress } from '$lib/utils/issue-counts';
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
  import MilestonePicker from '$lib/components/MilestonePicker.svelte';
  import { toast } from 'svelte-sonner';

  interface Props {
    open: boolean;
    mode?: 'create' | 'edit';
    epic: Epic | null;
    projectId?: string;
    projectName?: string;
    counts: IssueCounts | null;
    userId?: string;
    milestones?: Milestone[];
    issues?: Issue[];
  }

  let {
    open = $bindable(false),
    mode = 'edit',
    epic,
    projectId,
    projectName,
    counts,
    userId = '',
    milestones = [],
    issues = [],
  }: Props = $props();

  // Internal mode: can diverge from parent's `mode` prop during create-to-edit transition
  let internalMode = $state<'create' | 'edit'>((() => mode)());
  let internalEpic = $state<Epic | null>(null);
  let effectiveEpic = $derived(internalEpic ?? epic);

  let localName = $state('');
  let localStatus = $state<EpicStatus>('active');
  let localPriority = $state<number | null>(null);
  let localDescription = $state<string | null>(null);
  let localMilestoneId = $state<string | null>(null);
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
    if (!effectiveEpic || !projectId) return;
    await copyDeepLink({ projectId, epicId: effectiveEpic.id });
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

  // Initialize local state when epic changes (edit mode)
  $effect(() => {
    if (internalMode === 'edit' && effectiveEpic) {
      localName = effectiveEpic.name;
      localStatus = effectiveEpic.status;
      localPriority = effectiveEpic.priority ?? null;
      localMilestoneId = effectiveEpic.milestone_id ?? null;
      localDescription = effectiveEpic.description ?? null;
      lastPersistedDescriptionNormalized = normalizeDescription(effectiveEpic.description);
      saveState = 'idle';

      // Load attachments and links for this epic
      supabase
        .from('attachments')
        .select('*')
        .eq('entity_type', 'epic')
        .eq('entity_id', effectiveEpic.id)
        .order('created_at', { ascending: true })
        .then(({ data }) => {
          attachments = data ?? [];
        });
      supabase
        .from('links')
        .select('*')
        .eq('entity_type', 'epic')
        .eq('entity_id', effectiveEpic.id)
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
      localStatus = 'active';
      localPriority = null;
      localDescription = null;
      localMilestoneId = null;
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
      // Reset internal mode and created epic after close animation
      setTimeout(() => {
        internalMode = mode;
        internalEpic = null;
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
    if (!effectiveEpic || internalMode !== 'edit' || !open) return;

    const requestId = latestSaveRequestId + 1;
    latestSaveRequestId = requestId;
    clearSaveStateResetTimeout();
    saveState = 'saving';

    try {
      const formData = new FormData();
      formData.append('id', effectiveEpic!.id);
      formData.append(field, value);

      const response = await fetch('?/updateEpic', {
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

  function getIssueStatusVariant(status: IssueStatus) {
    if (status === 'done') return 'status-done';
    if (status === 'canceled') return 'status-canceled';
    if (status === 'in_progress') return 'status-doing';
    if (status === 'in_review') return 'status-in-review';
    return 'default';
  }

  function issueStatusLabel(status: IssueStatus) {
    if (status === 'backlog') return 'Backlog';
    if (status === 'in_progress') return 'In Progress';
    if (status === 'in_review') return 'In Review';
    if (status === 'todo') return 'Todo';
    if (status === 'done') return 'Done';
    return 'Canceled';
  }

  function handleNameInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    localName = value;
  }

  function handleNameBlur() {
    if (!effectiveEpic || internalMode !== 'edit' || !open) return;
    if (localName.trim() !== effectiveEpic.name) {
      autoSave('name', localName.trim());
    }
  }

  function handleStatusChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value as EpicStatus;
    localStatus = value;
    autoSave('status', value);
  }

  function handlePriorityChange(event: Event) {
    const raw = (event.target as HTMLSelectElement).value;
    localPriority = raw === '' ? null : Number(raw);
    autoSave('priority', raw);
  }

  function handleDescriptionChange(html: string) {
    localDescription = html;
  }

  function handleDescriptionBlur() {
    if (!effectiveEpic || internalMode !== 'edit' || !open) return;

    const normalizedCurrent = normalizeDescription(localDescription);
    if (normalizedCurrent === lastPersistedDescriptionNormalized) {
      return;
    }

    autoSave('description', localDescription ?? '');
    lastPersistedDescriptionNormalized = normalizedCurrent;
  }

  function handleMilestoneChange(milestoneId: string | null) {
    localMilestoneId = milestoneId;
    autoSave('milestone_id', milestoneId ?? '');
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
    if (!effectiveEpic || !userId) return;
    const path = buildStoragePath(userId, 'epic', effectiveEpic.id, file.name);
    const { error: uploadError } = await supabase.storage.from('attachments').upload(path, file);
    if (uploadError) {
      toast.error('Failed to upload file', {
        duration: 5000,
      });
      return;
    }
    const formData = new FormData();
    formData.append('entity_type', 'epic');
    formData.append('entity_id', effectiveEpic!.id);
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
    if (!effectiveEpic) return;
    const formData = new FormData();
    formData.append('entity_type', 'epic');
    formData.append('entity_id', effectiveEpic.id);
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

  // Create epic form submission
  async function handleCreateSubmit(event: Event) {
    event.preventDefault();

    if (!localName.trim()) {
      toast.error('Epic name is required', {
        duration: 5000,
      });
      return;
    }
    if (!projectId) {
      toast.error('Project is required', {
        duration: 5000,
      });
      return;
    }

    createLoading = true;

    try {
      const formData = new FormData();
      formData.append('name', localName.trim());
      formData.append('projectId', projectId);
      formData.append('status', localStatus);
      if (localPriority !== null) {
        formData.append('priority', String(localPriority));
      }
      if (localMilestoneId) {
        formData.append('milestone_id', localMilestoneId);
      }
      if (localDescription) {
        formData.append('description', localDescription);
      }

      const response = await fetch('?/createEpic', {
        method: 'POST',
        body: formData,
      });

      const result = deserialize(await response.text());

      if (result.type === 'success') {
        const newEpic = (result.data as any).epic;

        // Set internal epic for edit mode
        internalEpic = newEpic;
        attachments = [];

        // Transition to edit mode
        internalMode = 'edit';

        await invalidateAll();

        toast.success('Epic created', {
          duration: 2000,
        });
      } else {
        toast.error((result as any).data?.error || 'Failed to create epic', {
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Create epic error:', error);
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
    {#if open && internalMode === 'edit' && !effectiveEpic}
      <!-- Skeleton while epic data populates -->
      <div class="space-y-5 pb-6">
        <Skeleton class="h-5 w-2/3" />
        <Skeleton class="h-8 w-full" />
        <Skeleton class="h-8 w-3/4" />
        <Skeleton class="h-24 w-full" />
      </div>
    {:else if internalMode === 'create' || effectiveEpic}
      <!-- Loading overlay -->
      {#if createLoading}
        <LoadingOverlay />
      {/if}

      <SheetHeader class="mb-6">
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1 min-w-0">
            <SheetTitle class="text-xs uppercase font-medium text-foreground-muted tracking-wide">
              {#if internalMode === 'create'}
                New Epic
              {:else if effectiveEpic}
                E-{effectiveEpic.number} · Epic
              {:else}
                Epic
              {/if}
            </SheetTitle>
            {#if projectName}
              <p class="text-xs text-muted-foreground mt-0.5">{projectName}</p>
            {/if}
          </div>
          {#if internalMode === 'edit'}
            <button
              onclick={handleCopyLink}
              aria-label="Copy link to epic"
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

      {#if internalMode === 'edit' && saveState !== 'idle'}
        <div class="flex items-center mb-3 text-xs">
          {#if saveState === 'saving'}
            <span class="inline-flex items-center gap-1.5 text-muted-foreground">
              <span class="size-1.5 rounded-full bg-muted-foreground animate-pulse"></span>
              Saving
            </span>
          {:else if saveState === 'saved'}
            <span class="inline-flex items-center gap-1.5 text-green-600 dark:text-green-400">
              <CheckIcon class="size-3" />
              Saved
            </span>
          {:else if saveState === 'error'}
            <span class="inline-flex items-center gap-1.5 text-destructive">
              <AlertCircleIcon class="size-3" />
              Save failed
            </span>
          {/if}
        </div>
      {/if}

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
              placeholder="Epic name"
              class="text-body"
            />
          </section>

          <!-- Status / Priority / Milestone -->
          <section>
            <div class="space-y-2">
              <div class="flex items-center gap-3">
                <label for="create-status" class="text-xs text-foreground-muted w-20 shrink-0"
                  >Status</label
                >
                <select
                  id="create-status"
                  bind:value={localStatus}
                  disabled={createLoading}
                  class="flex h-8 flex-1 rounded-md border border-input bg-background px-3 py-1 text-base md:text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="backlog">Backlog</option>
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="canceled">Canceled</option>
                </select>
              </div>
              <div class="flex items-center gap-3">
                <label for="create-priority" class="text-xs text-foreground-muted w-20 shrink-0"
                  >Priority</label
                >
                <select
                  id="create-priority"
                  value={localPriority !== null ? String(localPriority) : ''}
                  onchange={(e) => {
                    const raw = e.currentTarget.value;
                    localPriority = raw === '' ? null : Number(raw);
                  }}
                  disabled={createLoading}
                  class="flex h-8 flex-1 rounded-md border border-input bg-background px-3 py-1 text-base md:text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">None</option>
                  <option value="0">P0 — Highest</option>
                  <option value="1">P1 — High</option>
                  <option value="2">P2 — Medium</option>
                  <option value="3">P3 — Low</option>
                </select>
              </div>
              <div class="flex items-center gap-3">
                <label for="create-milestone" class="text-xs text-foreground-muted w-20 shrink-0"
                  >Milestone</label
                >
                <div class="flex-1">
                  <MilestonePicker
                    selectedMilestoneId={localMilestoneId}
                    {milestones}
                    disabled={createLoading}
                    onChange={(id) => {
                      localMilestoneId = id;
                    }}
                  />
                </div>
              </div>
            </div>
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
            {createLoading ? 'Creating...' : 'Create Epic'}
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
              onblur={handleNameBlur}
              placeholder="Epic name"
              class="text-body"
            />
          </section>

          <!-- Status / Priority / Milestone -->
          <section>
            <div class="space-y-2">
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
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="canceled">Canceled</option>
                </select>
              </div>
              <div class="flex items-center gap-3">
                <label for="edit-priority" class="text-xs text-foreground-muted w-20 shrink-0"
                  >Priority</label
                >
                <select
                  id="edit-priority"
                  value={localPriority !== null ? String(localPriority) : ''}
                  onchange={handlePriorityChange}
                  class="flex h-8 flex-1 rounded-md border border-input bg-background px-3 py-1 text-base md:text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">None</option>
                  <option value="0">P0 — Highest</option>
                  <option value="1">P1 — High</option>
                  <option value="2">P2 — Medium</option>
                  <option value="3">P3 — Low</option>
                </select>
              </div>
              <div class="flex items-center gap-3">
                <label for="edit-milestone" class="text-xs text-foreground-muted w-20 shrink-0"
                  >Milestone</label
                >
                <div class="flex-1">
                  <MilestonePicker
                    selectedMilestoneId={localMilestoneId}
                    {milestones}
                    onChange={handleMilestoneChange}
                  />
                </div>
              </div>
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

          <!-- Progress -->
          {#if counts}
            <section>
              <h3 class="section-header">Progress</h3>
              <IssueCountsBadges {counts} />
              {#if computeProgress(counts).total > 0}
                <div class="mt-3">
                  <ProgressBar
                    percentage={computeProgress(counts).percentage}
                    ariaLabel="Epic completion progress"
                  />
                </div>
              {/if}
            </section>
          {/if}

          <!-- Issues -->
          {#if issues.length > 0}
            <section>
              <h3 class="section-header">Issues</h3>
              <div class="space-y-2">
                {#each issues as issue (issue.id)}
                  <div class="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                    <Badge variant={getIssueStatusVariant(issue.status)} class="text-xs shrink-0">
                      {issueStatusLabel(issue.status)}
                    </Badge>
                    <span class="text-body flex-1 truncate">{issue.title}</span>
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
