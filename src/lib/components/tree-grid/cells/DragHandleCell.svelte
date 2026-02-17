<script lang="ts">
  /**
   * DragHandleCell Component - Drag Handle for Row Reordering
   *
   * Displays a grip icon that allows users to drag and reorder rows
   * when edit mode is enabled. Shows on hover with smooth opacity transition.
   */

  import GripVertical from '@lucide/svelte/icons/grip-vertical';

  interface Props {
    editMode: boolean;
  }

  let { editMode }: Props = $props();
</script>

{#if editMode}
  <GripVertical
    class="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab"
  />
{/if}
