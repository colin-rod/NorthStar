<script lang="ts">
  /**
   * InlineIssueForm Component - North Design System
   *
   * Inline form for quickly creating issues.
   * Used in: Epic detail view
   *
   * North Design Principles:
   * - Minimal, focused UI
   * - Single-purpose form (just title)
   * - Keyboard-friendly (Escape to cancel, Enter to submit)
   * - Auto-focus on mount
   *
   * Requirements from CLAUDE.md:
   * - Inline "Add issue" functionality
   * - Create issue defaults: status='todo', priority=2, epic=current epic
   */

  import { enhance } from '$app/forms';
  import Input from '$lib/components/ui/input.svelte';
  import Button from '$lib/components/ui/button.svelte';
  import { invalidateAll } from '$app/navigation';

  interface Props {
    epicId: string;
    projectId: string;
    onCancel: () => void;
    onSuccess?: () => void;
  }

  let { epicId, projectId, onCancel, onSuccess }: Props = $props();

  let loading = $state(false);
  let inputElement: HTMLInputElement | undefined = $state(undefined);

  // Auto-focus on mount
  $effect(() => {
    if (inputElement) {
      inputElement.focus();
    }
  });

  // Handle keyboard shortcuts
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onCancel();
    }
  }
</script>

<form
  method="POST"
  action="?/createIssue"
  use:enhance={() => {
    loading = true;
    return async ({ result, update }) => {
      loading = false;
      if (result.type === 'success') {
        // Reload page data to show new issue
        await invalidateAll();
        onSuccess?.();
      } else {
        await update();
      }
    };
  }}
  class="border rounded-md p-4 bg-surface-subtle mb-4"
  onkeydown={handleKeydown}
>
  <input type="hidden" name="epic_id" value={epicId} />
  <input type="hidden" name="project_id" value={projectId} />

  <div class="flex gap-2">
    <div class="flex-1">
      <Input
        bind:ref={inputElement}
        id="title"
        name="title"
        placeholder="Issue title..."
        required
        maxlength={500}
        disabled={loading}
        class="text-body"
      />
    </div>

    <Button type="submit" disabled={loading} size="sm">
      {loading ? 'Creating...' : 'Create'}
    </Button>

    <Button type="button" variant="outline" onclick={onCancel} disabled={loading} size="sm">
      Cancel
    </Button>
  </div>

  <p class="text-xs text-foreground-muted mt-2">Press Escape to cancel, Enter to create</p>
</form>
