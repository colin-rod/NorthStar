<script lang="ts">
  /**
   * AddRow Component - Inline "Add ..." Row
   *
   * Displays "+ Add epic/issue/sub-issue" row that converts to input on click.
   * Shown at the bottom of an expanded parent's children list.
   */

  import Plus from '@lucide/svelte/icons/plus';
  import type { TreeNode } from '$lib/types/tree-grid';

  interface Props {
    parentNode: TreeNode;
    level: 1 | 2 | 3; // Epic, Issue, or Sub-issue
    indentation: string;
    onCreate: (data: { title: string }) => void;
  }

  let { parentNode, level, indentation, onCreate }: Props = $props();

  let isAdding = $state(false);
  let title = $state('');

  const placeholders = {
    1: '+ Add epic',
    2: '+ Add issue',
    3: '+ Add sub-issue',
  };

  function startAdding() {
    isAdding = true;
  }

  function handleSubmit() {
    if (title.trim()) {
      onCreate({ title: title.trim() });
      title = '';
      isAdding = false;
    }
  }

  function handleCancel() {
    title = '';
    isAdding = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  }
</script>

{#if isAdding}
  <!-- Input mode -->
  <tr class="border-b border-border-divider bg-surface-subtle/50">
    <td class="py-2 px-4" colspan="7">
      <div class="flex items-center gap-2" style="padding-left: {indentation}">
        <input
          type="text"
          bind:value={title}
          onkeydown={handleKeydown}
          placeholder="Enter title..."
          class="flex-1 px-2 py-1 text-sm border border-accent rounded focus:outline-none focus:ring-1 focus:ring-accent"
          autofocus
        />
        <button
          onclick={handleSubmit}
          class="px-3 py-1 text-sm bg-primary text-white rounded hover:bg-primary-hover transition-colors"
        >
          Add
        </button>
        <button
          onclick={handleCancel}
          class="px-3 py-1 text-sm border border-border rounded hover:bg-surface-subtle transition-colors"
        >
          Cancel
        </button>
      </div>
    </td>
  </tr>
{:else}
  <!-- Add button row -->
  <tr
    class="border-b border-border-divider hover:bg-surface-subtle transition-colors cursor-pointer"
    onclick={startAdding}
  >
    <td class="py-3 px-4" colspan="7">
      <div
        class="flex items-center gap-2 text-foreground-secondary"
        style="padding-left: {indentation}"
      >
        <Plus class="h-4 w-4" />
        <span class="text-sm">{placeholders[level]}</span>
      </div>
    </td>
  </tr>
{/if}
