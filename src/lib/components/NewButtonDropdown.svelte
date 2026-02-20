<script lang="ts">
  import { Popover, PopoverTrigger, PopoverContent } from '$lib/components/ui/popover';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import { isIssueSheetOpen, projectSheetOpen } from '$lib/stores/issues';

  let open = $state(false);

  function handleNewIssue() {
    isIssueSheetOpen.set(true);
    open = false;
  }

  function handleNewProject() {
    projectSheetOpen.set(true);
    open = false;
  }
</script>

<Popover bind:open>
  <PopoverTrigger
    class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-white hover:bg-primary-hover h-10 px-4 py-2"
  >
    New...
    <ChevronDown class="ml-2 h-4 w-4" />
  </PopoverTrigger>
  <PopoverContent align="end" class="w-[160px] p-1">
    <button
      role="menuitem"
      onclick={handleNewIssue}
      class="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      New Issue
    </button>
    <button
      role="menuitem"
      onclick={handleNewProject}
      class="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      New Project
    </button>
  </PopoverContent>
</Popover>
