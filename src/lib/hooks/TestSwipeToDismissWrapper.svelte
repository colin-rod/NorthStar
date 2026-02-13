<script lang="ts">
  import { useSwipeToDismiss } from './useSwipeToDismiss.svelte';

  let { onDismiss = () => {} }: { onDismiss?: () => void } = $props();

  let elementRef = $state<HTMLElement | null>(null);

  // Call the hook with reactive references
  $effect(() => {
    if (elementRef) {
      useSwipeToDismiss(elementRef, onDismiss);
    }
  });
</script>

<div bind:this={elementRef} data-testid="swipe-target" class="h-32 w-full bg-gray-200">
  Swipe target
</div>
