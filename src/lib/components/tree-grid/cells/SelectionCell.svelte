<script lang="ts">
  /**
   * SelectionCell Component - Checkbox for Multi-Select
   *
   * 20x20 visual, 28x28 hit area
   * Supports indeterminate state (future enhancement)
   */

  interface Props {
    checked: boolean;
    indeterminate?: boolean;
    onToggle: () => void;
  }

  let { checked, indeterminate = false, onToggle }: Props = $props();
</script>

<div class="flex items-center">
  <label class="flex items-center justify-center w-6 h-6 cursor-pointer">
    <input
      type="checkbox"
      {checked}
      {indeterminate}
      onchange={onToggle}
      class="w-4 h-4 rounded border-border text-primary focus:ring-1 focus:ring-accent cursor-pointer"
    />
  </label>
</div>
