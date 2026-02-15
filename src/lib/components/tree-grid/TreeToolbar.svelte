<script lang="ts">
  /**
   * TreeToolbar Component - Edit Mode Toggle + Bulk Actions
   *
   * Displays edit mode toggle and bulk action buttons when items are selected.
   */

  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';

  interface Props {
    editMode: boolean;
    selectedCount: number;
    onEditModeChange: (enabled: boolean) => void;
    onBulkAction: (action: string) => void;
  }

  let { editMode, selectedCount, onEditModeChange, onBulkAction }: Props = $props();
</script>

<div class="flex items-center justify-between h-11 px-4 border-b border-border-divider bg-surface">
  <!-- Left: Edit mode toggle -->
  <div class="flex items-center gap-3">
    <label class="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={editMode}
        onchange={(e) => onEditModeChange(e.currentTarget.checked)}
        class="sr-only"
      />
      <div class="text-metadata {editMode ? 'text-primary' : 'text-foreground-muted'}">
        Edit mode {editMode ? 'ON' : 'OFF'}
      </div>
    </label>

    {#if editMode}
      <Badge variant="default" class="text-xs">Editing</Badge>
    {/if}
  </div>

  <!-- Right: Bulk actions (if any selected) -->
  <div class="flex items-center gap-2">
    {#if selectedCount > 0}
      <span class="text-metadata text-foreground-secondary">{selectedCount} selected</span>
      <Button size="sm" variant="outline" onclick={() => onBulkAction('delete')}>Delete</Button>
    {/if}
  </div>
</div>
