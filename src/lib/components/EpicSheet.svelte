<script lang="ts">
  /**
   * EpicSheet Component - North Design System
   *
   * Bottom sheet for creating and editing epics.
   * Used in: Projects list view (inline drill-down)
   *
   * North Design Principles:
   * - Mobile-first bottom sheet
   * - Clean form layout with validation
   * - Warm orange primary actions
   * - 10px border radius
   *
   * Props:
   * - open: Controls sheet visibility (bindable)
   * - mode: 'create' | 'edit' - Determines form action and title
   * - epic: Optional epic data for edit mode
   * - projectId: Required for create mode (parent project)
   */

  import { enhance } from '$app/forms';
  import type { Epic } from '$lib/types';
  import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetFooter,
    SheetTitle,
  } from '$lib/components/ui/sheet';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';

  interface Props {
    open: boolean;
    mode: 'create' | 'edit';
    epic?: Epic;
    projectId?: string;
  }

  let { open = $bindable(false), mode, epic, projectId }: Props = $props();

  // Use $derived to make these reactive to mode changes
  const action = $derived(mode === 'create' ? '?/createEpic' : '?/updateEpic');
  const title = $derived(mode === 'create' ? 'New Epic' : 'Edit Epic');
  const submitLabel = $derived(mode === 'create' ? 'Create Epic' : 'Save Changes');
</script>

<Sheet bind:open>
  <SheetContent side="bottom" class="h-[400px] sm:max-w-xl sm:mx-auto">
    <SheetHeader>
      <SheetTitle class="text-section-header">{title}</SheetTitle>
    </SheetHeader>

    <form
      method="POST"
      {action}
      use:enhance={() => {
        return async ({ result }) => {
          if (result.type === 'success') {
            open = false;
          }
        };
      }}
      class="mt-6 space-y-6"
    >
      {#if mode === 'edit' && epic}
        <input type="hidden" name="id" value={epic.id} />
      {/if}

      {#if mode === 'create' && projectId}
        <input type="hidden" name="projectId" value={projectId} />
      {/if}

      <div class="space-y-2">
        <Label for="name" class="text-sm font-medium">Epic Name</Label>
        <Input
          id="name"
          name="name"
          value={epic?.name ?? ''}
          required
          maxlength={100}
          placeholder="e.g., User Authentication"
          class="focus-visible:ring-primary"
        />
        <p class="text-xs text-foreground-muted">Maximum 100 characters</p>
      </div>

      <div class="space-y-2">
        <Label for="status" class="text-sm font-medium">Status</Label>
        <select
          id="status"
          name="status"
          value={epic?.status ?? 'active'}
          class="flex min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="active">Active</option>
          <option value="done">Done</option>
          <option value="canceled">Canceled</option>
        </select>
      </div>

      <SheetFooter class="flex gap-2">
        <Button type="button" variant="outline" onclick={() => (open = false)}>Cancel</Button>
        <Button type="submit" class="bg-primary hover:bg-primary-hover text-white">
          {submitLabel}
        </Button>
      </SheetFooter>
    </form>
  </SheetContent>
</Sheet>
