<script lang="ts">
  import { projectSheetOpen } from '$lib/stores/issues';
</script>

<button
  type="button"
  onclick={() => projectSheetOpen.set(true)}
  class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-white hover:bg-primary-hover h-11 px-4 py-2"
>
  New Project
</button>
