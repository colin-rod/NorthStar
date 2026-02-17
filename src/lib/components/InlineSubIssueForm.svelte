<script lang="ts">
  /**
   * InlineSubIssueForm Component - North Design System
   *
   * Inline form for quickly creating sub-issues within a parent issue.
   * Used in: IssueSheet component
   *
   * North Design Principles:
   * - Minimal, focused UI
   * - Single-purpose form (just title)
   * - Keyboard-friendly (Escape to cancel, Enter to submit)
   * - Auto-focus on mount
   *
   * Requirements from CLAUDE.md:
   * - Create sub-issue with parent_issue_id
   * - Inherit epic from parent
   * - Auto-save defaults: status='todo', priority=2
   */

  import { enhance } from '$app/forms';
  import { Button } from '$lib/components/ui/button';
  import { invalidateAll } from '$app/navigation';

  interface Props {
    parentIssueId: string;
    epicId: string;
    projectId: string;
    onCancel: () => void;
    onSuccess?: () => void;
  }

  let { parentIssueId, epicId, projectId, onCancel, onSuccess }: Props = $props();

  let loading = $state(false);
  let inputElement: HTMLInputElement | undefined = undefined;

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
        // Reload page data to show new sub-issue
        await invalidateAll();
        onSuccess?.();
      } else {
        await update();
      }
    };
  }}
  class="border rounded-md p-4 bg-surface-subtle mb-4"
>
  <!-- Hidden fields -->
  <input type="hidden" name="parent_issue_id" value={parentIssueId} />
  <input type="hidden" name="epic_id" value={epicId} />
  <input type="hidden" name="project_id" value={projectId} />

  <div class="flex gap-2">
    <div class="flex-1">
      <input
        bind:this={inputElement}
        id="sub-issue-title"
        name="title"
        placeholder="Sub-issue title..."
        required
        maxlength={500}
        disabled={loading}
        onkeydown={handleKeydown}
        class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm text-body"
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
