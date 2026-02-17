<script lang="ts">
  import { useKeyboardAwareHeight } from './useKeyboardAwareHeight.svelte';

  let elementRef = $state<HTMLElement | null>(null);

  $effect(() => {
    if (elementRef) {
      useKeyboardAwareHeight(elementRef);
    }
  });
</script>

<div bind:this={elementRef} data-testid="height-target" class="overflow-y-auto">Content</div>
