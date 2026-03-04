<script lang="ts">
  /**
   * TreeToolbar Component - Breadcrumb + Bulk Actions
   */

  import { Button } from '$lib/components/ui/button';

  interface Props {
    selectedCount: number;
    breadcrumb: string;
    onBulkAction: (action: string) => void;
  }

  let { selectedCount, breadcrumb, onBulkAction }: Props = $props();
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

  <!-- Right: bulk actions -->
  <div class="flex items-center gap-4">
    {#if selectedCount > 0}
      <div class="flex items-center gap-2">
        <span class="text-metadata text-foreground-secondary">{selectedCount} selected</span>
        <Button size="sm" variant="outline" onclick={() => onBulkAction('delete')}>Delete</Button>
      </div>
    {/if}
  </div>
</div>
