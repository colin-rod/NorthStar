<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
  import { Command, CommandInput, CommandList, CommandItem } from '$lib/components/ui/command';
  import { Checkbox } from '$lib/components/ui/checkbox';

  export let projects: Array<{ id: string; name: string }>;
  export let selectedProjectIds: string[];

  let open = false;
  let searchQuery = '';

  // Filtered projects based on search
  $: filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Display text for trigger button
  $: buttonText =
    selectedProjectIds.length === 0 ? 'All Projects' : `Projects (${selectedProjectIds.length})`;

  function toggleProject(projectId: string) {
    const newSelection = selectedProjectIds.includes(projectId)
      ? selectedProjectIds.filter((id) => id !== projectId)
      : [...selectedProjectIds, projectId];

    updateURL(newSelection);
  }

  function updateURL(projectIds: string[]) {
    const params = new URLSearchParams($page.url.searchParams);

    if (projectIds.length === 0) {
      params.delete('projects');
    } else {
      params.set('projects', projectIds.join(','));
    }

    const newUrl = params.toString() ? `/?${params.toString()}` : '/';

    goto(newUrl, {
      replaceState: false, // Enable browser back button
      keepFocus: true, // Keep popover open
      noScroll: true, // Maintain scroll position
    });
  }
</script>

<Popover bind:open>
  <PopoverTrigger
    class="inline-flex items-center justify-start rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
  >
    {buttonText}
  </PopoverTrigger>
  <PopoverContent class="w-[300px] p-0" align="start">
    <Command>
      <CommandInput placeholder="Search projects..." bind:value={searchQuery} />
      <CommandList>
        {#each filteredProjects as project (project.id)}
          <CommandItem
            onSelect={() => toggleProject(project.id)}
            class="flex items-center gap-2 cursor-pointer"
            data-testid="project-checkbox"
          >
            <Checkbox checked={selectedProjectIds.includes(project.id)} aria-label={project.name} />
            <span>{project.name}</span>
          </CommandItem>
        {/each}
        {#if filteredProjects.length === 0}
          <div class="py-6 text-center text-sm text-muted-foreground">No projects found</div>
        {/if}
      </CommandList>
    </Command>
  </PopoverContent>
</Popover>
