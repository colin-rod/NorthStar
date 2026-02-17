<script lang="ts">
  /**
   * TreeToolbar Component - Edit Mode Toggle + Bulk Actions
   *
   * Displays edit mode toggle and bulk action buttons when items are selected.
   */

  import { Button } from '$lib/components/ui/button';
  import { Switch } from '$lib/components/ui/switch';

  interface Props {
    editMode: boolean;
    selectedCount: number;
    breadcrumb: string;
    onEditModeChange: (enabled: boolean) => void;
    onBulkAction: (action: string) => void;
  }

  let { editMode, selectedCount, breadcrumb, onEditModeChange, onBulkAction }: Props = $props();
</script>

<div class="flex items-center justify-between h-11 px-4 border-b border-border-divider bg-surface">
  <!-- Left: Breadcrumb -->
  <div class="flex items-center gap-3">
    {#if breadcrumb}
      <div class="text-sm text-muted-foreground">
        {breadcrumb}
      </div>
    {/if}
  </div>

  <!-- Right: Edit mode toggle + bulk actions -->
  <div class="flex items-center gap-4">
    <!-- Edit mode toggle -->
    <div class="flex items-center gap-2">
      <span class="text-metadata text-foreground-muted">Edit mode</span>
      <Switch checked={editMode} onCheckedChange={onEditModeChange} />
    </div>

    <!-- Bulk actions (if any selected) -->
    {#if selectedCount > 0}
      <div class="flex items-center gap-2">
        <span class="text-metadata text-foreground-secondary">{selectedCount} selected</span>
        <Button size="sm" variant="outline" onclick={() => onBulkAction('delete')}>Delete</Button>
      </div>
    {/if}
  </div>
</div>
