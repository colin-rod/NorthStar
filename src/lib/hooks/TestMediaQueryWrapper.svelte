<script lang="ts">
  import { useMediaQuery } from './useMediaQuery.svelte';

  let { query }: { query: string } = $props();

  // Use a derived state to ensure reactivity to query changes
  const matches = $derived(useMediaQuery(query));
</script>

<div data-testid="media-query-result">{matches() ? 'true' : 'false'}</div>
