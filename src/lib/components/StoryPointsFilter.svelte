<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
  import { Command, CommandInput, CommandList, CommandItem } from '$lib/components/ui/command';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import type { Issue, StoryPoints } from '$lib/types';

  interface Props {
    selectedStoryPoints: string[];
    issues: Issue[];
  }

  let { selectedStoryPoints, issues }: Props = $props();

  let open = $state(false);
  let searchQuery = $state('');

  // Story points options
  const storyPointOptions: { value: string; label: string }[] = [
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '5', label: '5' },
    { value: '8', label: '8' },
    { value: '13', label: '13' },
    { value: '21', label: '21' },
    { value: 'none', label: 'None' },
  ];

  // Calculate counts for each story point value
  let storyPointCounts = $derived.by(() => {
    const counts = new Map<string, number>();
    for (const option of storyPointOptions) {
      if (option.value === 'none') {
        counts.set(option.value, issues.filter((i) => i.story_points === null).length);
      } else {
        counts.set(
          option.value,
          issues.filter((i) => i.story_points === parseInt(option.value)).length,
        );
      }
    }
    return counts;
  });

  // Filtered options based on search
  let filteredOptions = $derived(
    storyPointOptions.filter((o) => o.label.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  // Display text for trigger button
  let buttonText = $derived.by(() => {
    if (selectedStoryPoints.length === 0) {
      return 'Story Points';
    }
    if (selectedStoryPoints.length === 1) {
      const option = storyPointOptions.find((o) => o.value === selectedStoryPoints[0]);
      return `Story Points: ${option?.label}`;
    }
    return `Story Points (${selectedStoryPoints.length})`;
  });

  function toggleStoryPoint(value: string) {
    const newSelection = selectedStoryPoints.includes(value)
      ? selectedStoryPoints.filter((s) => s !== value)
      : [...selectedStoryPoints, value];

    updateURL(newSelection);
  }

  function updateURL(points: string[]) {
    const params = new URLSearchParams($page.url.searchParams);

    if (points.length === 0) {
      params.delete('story_points');
    } else {
      params.set('story_points', points.join(','));
    }

    const newUrl = `${$page.url.pathname}?${params.toString()}`;

    goto(newUrl, {
      replaceState: false,
      keepFocus: true,
      noScroll: true,
    });
  }
</script>

<Popover bind:open>
  <PopoverTrigger
    class="inline-flex items-center justify-start rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
  >
    {buttonText}
  </PopoverTrigger>
  <PopoverContent class="w-[250px] p-0" align="start">
    <Command>
      <CommandInput placeholder="Search story points..." bind:value={searchQuery} />
      <CommandList>
        {#each filteredOptions as option (option.value)}
          <CommandItem
            onSelect={() => toggleStoryPoint(option.value)}
            class="flex items-center gap-2 cursor-pointer"
            data-testid="story-points-checkbox"
          >
            <Checkbox
              checked={selectedStoryPoints.includes(option.value)}
              aria-label={option.label}
            />
            <span class="flex-1">{option.label}</span>
            <span class="text-muted-foreground text-sm">
              ({storyPointCounts.get(option.value) || 0})
            </span>
          </CommandItem>
        {/each}
        {#if filteredOptions.length === 0}
          <div class="py-6 text-center text-sm text-muted-foreground">No options found</div>
        {/if}
      </CommandList>
    </Command>
  </PopoverContent>
</Popover>
