<script lang="ts">
  import type { Epic } from '$lib/types';
  import type { IssueCounts } from '$lib/utils/issue-counts';
  import { computeProgress } from '$lib/utils/issue-counts';
  import { Sheet, SheetContent, SheetHeader, SheetTitle } from '$lib/components/ui/sheet';
  import { Input } from '$lib/components/ui/input';
  import { Badge } from '$lib/components/ui/badge';
  import { invalidateAll } from '$app/navigation';
  import { useMediaQuery } from '$lib/hooks/useMediaQuery.svelte';
  import { useKeyboardAwareHeight } from '$lib/hooks/useKeyboardAwareHeight.svelte';

  interface Props {
    open: boolean;
    epic: Epic | null;
    counts: IssueCounts | null;
  }

  let { open = $bindable(false), epic, counts }: Props = $props();

  let localName = $state('');
  let localStatus = $state<'active' | 'done' | 'canceled'>('active');
  let saveError = $state<string | null>(null);
  let saveSuccess = $state(false);
  let sheetContentRef = $state<HTMLElement | null>(null);

  let titleDebounceTimer: ReturnType<typeof setTimeout> | null = null;

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

  $effect(() => {
    if (epic) {
      localName = epic.name;
      localStatus = epic.status;
      saveError = null;
      saveSuccess = false;
    }
  });

  async function autoSave(field: string, value: string) {
    if (!epic) return;

    saveError = null;
    saveSuccess = false;

    try {
      const formData = new FormData();
      formData.append('id', epic.id);
      formData.append(field, value);

      const response = await fetch('?/updateEpic', {
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

  function handleStatusChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value as 'active' | 'done' | 'canceled';
    localStatus = value;
    autoSave('status', value);
  }
</script>

<Sheet bind:open>
  <SheetContent side={sheetSide} class={sheetClass} bind:ref={sheetContentRef}>
    {#if epic}
      <SheetHeader class="mb-6">
        <SheetTitle class="text-xs uppercase font-medium text-foreground-muted tracking-wide">
          E-{epic.number} · Epic
        </SheetTitle>
      </SheetHeader>

      <div class="space-y-6">
        <!-- Name -->
        <section>
          <h3 class="text-xs uppercase font-medium text-foreground-muted mb-2 tracking-wide">
            Name
          </h3>
          <Input
            value={localName}
            oninput={handleNameInput}
            placeholder="Epic name"
            class="text-body"
          />
        </section>

        <!-- Status -->
        <section>
          <h3 class="text-xs uppercase font-medium text-foreground-muted mb-2 tracking-wide">
            Status
          </h3>
          <select
            value={localStatus}
            onchange={handleStatusChange}
            class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="active">Active</option>
            <option value="done">Done</option>
            <option value="canceled">Canceled</option>
          </select>
        </section>

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

        <!-- Save feedback -->
        {#if saveError}
          <p class="text-sm text-destructive">{saveError}</p>
        {/if}
        {#if saveSuccess}
          <p class="text-sm text-foreground-secondary">Saved</p>
        {/if}
      </div>
    {/if}
  </SheetContent>
</Sheet>
