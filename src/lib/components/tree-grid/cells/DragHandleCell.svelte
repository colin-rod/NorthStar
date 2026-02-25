<script lang="ts">
  /**
   * DragHandleCell Component - Drag Handle for Row Reordering
   *
   * Displays a grip icon that allows users to drag and reorder rows
   * when edit mode is enabled. Shows on hover with smooth opacity transition.
   */

  import GripVertical from '@lucide/svelte/icons/grip-vertical';
  import X from '@lucide/svelte/icons/x';
  import { dismissReorderHint, reorderHintDismissed } from '$lib/stores/ui-hints';

  interface Props {
    editMode: boolean;
    showReorderHint?: boolean;
  }

  let { editMode, showReorderHint = false }: Props = $props();
</script>

{#if editMode}
  <div class="relative">
    <GripVertical
      class="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab"
      role="button"
      tabindex={-1}
      aria-label="Drag to reorder"
      onmousedown={dismissReorderHint}
      ontouchstart={dismissReorderHint}
    />

    {#if showReorderHint && !$reorderHintDismissed}
      <div
        class="absolute left-5 top-1/2 -translate-y-1/2 z-10 flex items-center gap-2 whitespace-nowrap rounded-md border border-border-divider bg-surface px-2 py-1 text-xs text-muted-foreground shadow-sm"
        role="status"
        aria-live="polite"
      >
        <span>Tip: Hover and drag to reorder</span>
        <button
          type="button"
          class="rounded p-0.5 hover:bg-surface-subtle"
          aria-label="Dismiss reorder tip"
          onclick={(e) => {
            e.stopPropagation();
            dismissReorderHint();
          }}
        >
          <X class="h-3 w-3" />
        </button>
      </div>
    {/if}
  </div>
{/if}
