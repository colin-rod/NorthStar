<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
  import { Command, CommandInput, CommandList, CommandItem } from '$lib/components/ui/command';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { getPriorityLabel } from '$lib/utils/issue-helpers';
  import type { Issue } from '$lib/types';
  import SearchX from '@lucide/svelte/icons/search-x';

  interface Props {
    selectedPriorities: number[];
    issues: Issue[];
  }

  let { selectedPriorities, issues }: Props = $props();

  let open = $state(false);
  let searchQuery = $state('');

  // Priority options with labels and descriptions
  const priorities = [
    { value: 0, label: 'P0', description: 'Critical' },
    { value: 1, label: 'P1', description: 'High' },
    { value: 2, label: 'P2', description: 'Medium' },
    { value: 3, label: 'P3', description: 'Low' },
  ];

  // Calculate counts for each priority
  let priorityCounts = $derived.by(() => {
    const counts = new Map<number, number>();
    for (const priority of priorities) {
      counts.set(priority.value, issues.filter((i) => i.priority === priority.value).length);
    }
    return counts;
  });

  // Filtered priorities based on search
  let filteredPriorities = $derived(
    priorities.filter(
      (p) =>
        p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
  );

  let isActive = $derived(selectedPriorities.length > 0);

  // Display text for trigger button
  let buttonText = $derived.by(() => {
    if (selectedPriorities.length === 0) {
      return 'Priority';
    }
    if (selectedPriorities.length === 1) {
      return `Priority: ${getPriorityLabel(selectedPriorities[0])}`;
    }
    return `Priority (${selectedPriorities.length})`;
  });

  function togglePriority(priority: number) {
    const newSelection = selectedPriorities.includes(priority)
      ? selectedPriorities.filter((p) => p !== priority)
      : [...selectedPriorities, priority];

    updateURL(newSelection);
  }

  function updateURL(priorities: number[]) {
    const params = new URLSearchParams($page.url.searchParams);

    if (priorities.length === 0) {
      params.delete('priority');
    } else {
      params.set('priority', priorities.join(','));
    }

    const newUrl = `${$page.url.pathname}?${params.toString()}`;

    goto(newUrl, {
      replaceState: false, // Enable browser back button
      keepFocus: true, // Keep popover open
      noScroll: true, // Maintain scroll position
    });
  }
</script>

<Popover bind:open>
  <PopoverTrigger
    class={[
      'inline-flex items-center justify-start rounded-md border px-4 py-2 text-sm font-medium',
      isActive
        ? 'bg-primary/10 border-primary text-primary hover:bg-primary/20'
        : 'border-input bg-background hover:bg-accent hover:text-accent-foreground',
    ].join(' ')}
  >
    {buttonText}
  </PopoverTrigger>
  <PopoverContent class="w-[250px] p-0" align="start">
    <Command>
      <CommandInput placeholder="Search priority..." bind:value={searchQuery} />
      <CommandList>
        {#each filteredPriorities as priority (priority.value)}
          <CommandItem
            onSelect={() => togglePriority(priority.value)}
            class="flex items-center gap-2 cursor-pointer"
            data-testid="priority-checkbox"
          >
            <Checkbox
              checked={selectedPriorities.includes(priority.value)}
              aria-label={`${priority.label} - ${priority.description}`}
            />
            <span class="flex-1">{priority.label} - {priority.description}</span>
            <span class="text-muted-foreground text-sm">
              ({priorityCounts.get(priority.value) || 0})
            </span>
          </CommandItem>
        {/each}
        {#if filteredPriorities.length === 0}
          <div
            class="py-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-1.5"
          >
            <SearchX class="h-4 w-4" />
            <span>No matches found</span>
          </div>
        {/if}
      </CommandList>
    </Command>
  </PopoverContent>
</Popover>
