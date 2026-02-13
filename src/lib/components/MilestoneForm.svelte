<script lang="ts">
  /**
   * MilestoneForm Component - North Design System
   *
   * Inline form for creating and editing milestones.
   * Used in: MilestonePicker component
   *
   * North Design Principles:
   * - Minimal, focused UI
   * - Two fields: name (required) and due_date (optional)
   * - Keyboard-friendly (Escape to cancel, Enter to submit)
   * - Auto-focus on mount
   *
   * Requirements from CLAUDE.md:
   * - Create/edit milestone with name and optional due_date
   * - Validate name (required, max 100 chars)
   * - User-scoped (global, cross-project)
   */

  import { enhance } from '$app/forms';
  import { Button } from '$lib/components/ui/button';
  import { Label } from '$lib/components/ui/label';
  import { invalidateAll } from '$app/navigation';
  import type { Milestone } from '$lib/types';

  interface Props {
    mode: 'create' | 'edit';
    milestone?: Milestone;
    onCancel: () => void;
    onSuccess?: () => void;
  }

  let { mode, milestone, onCancel, onSuccess }: Props = $props();

  let loading = $state(false);
  let nameInputElement: HTMLInputElement | undefined = undefined;

  // Initialize form values as state
  let nameValue = $state('');
  let dueDateValue = $state('');

  // Sync form values when milestone prop changes
  $effect(() => {
    nameValue = milestone?.name || '';
    dueDateValue = milestone?.due_date || '';
  });

  // Auto-focus on mount
  $effect(() => {
    if (nameInputElement) {
      nameInputElement.focus();
    }
  });

  // Handle keyboard shortcuts
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onCancel();
    }
  }

  // Form action based on mode (use $derived for reactivity)
  const formAction = $derived(mode === 'create' ? '?/createMilestone' : '?/updateMilestone');
</script>

<form
  method="POST"
  action={formAction}
  use:enhance={() => {
    loading = true;
    return async ({ result, update }) => {
      loading = false;
      if (result.type === 'success') {
        // Reload page data to show new/updated milestone
        await invalidateAll();
        onSuccess?.();
      } else {
        await update();
      }
    };
  }}
  class="space-y-4"
>
  <!-- Hidden field for edit mode (milestone ID) -->
  {#if mode === 'edit' && milestone?.id}
    <input type="hidden" name="id" value={milestone.id} />
  {/if}

  <!-- Name Field (Required) -->
  <div class="space-y-2">
    <Label for="milestone-name">Name</Label>
    <input
      bind:this={nameInputElement}
      id="milestone-name"
      name="name"
      type="text"
      placeholder="e.g., Q1 2026 Launch"
      required
      maxlength={100}
      disabled={loading}
      bind:value={nameValue}
      onkeydown={handleKeydown}
      class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm text-body"
    />
  </div>

  <!-- Due Date Field (Optional) -->
  <div class="space-y-2">
    <Label for="milestone-due-date">Due Date (Optional)</Label>
    <input
      id="milestone-due-date"
      name="due_date"
      type="date"
      disabled={loading}
      bind:value={dueDateValue}
      class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm text-body"
    />
  </div>

  <!-- Action Buttons -->
  <div class="flex gap-2">
    <Button type="submit" disabled={loading} size="sm" class="flex-1">
      {#if loading}
        {mode === 'create' ? 'Creating...' : 'Saving...'}
      {:else}
        {mode === 'create' ? 'Create' : 'Save'}
      {/if}
    </Button>

    <Button type="button" variant="outline" onclick={onCancel} disabled={loading} size="sm">
      Cancel
    </Button>
  </div>

  <p class="text-xs text-foreground-muted">Press Escape to cancel</p>
</form>
