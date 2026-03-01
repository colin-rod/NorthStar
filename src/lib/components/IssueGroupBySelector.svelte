<!-- src/lib/components/IssueGroupBySelector.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
  import { Command, CommandList, CommandItem } from '$lib/components/ui/command';
  import Check from '@lucide/svelte/icons/check';

  interface Props {
    selectedGroupBy: string;
  }

  let { selectedGroupBy }: Props = $props();

  let open = $state(false);

  const groupByOptions = [
    { value: 'none', label: 'None' },
    { value: 'priority', label: 'Priority' },
    { value: 'status', label: 'Status' },
    { value: 'story_points', label: 'Story Points' },
    { value: 'milestone', label: 'Milestone' },
  ];

  let selectedOption = $derived(
    groupByOptions.find((opt) => opt.value === selectedGroupBy) || groupByOptions[0],
  );

  let displayText = $derived(`Group By: ${selectedOption.label}`);

  function handleSelect(value: string) {
    const params = new URLSearchParams($page.url.searchParams);

    if (value === 'none') {
      params.delete('group_by');
    } else {
      params.set('group_by', value);
    }

    const newUrl = `${$page.url.pathname}?${params.toString()}`;
    goto(newUrl, { replaceState: false, keepFocus: true, noScroll: true });
    open = false;
  }
</script>

<Popover bind:open>
  <PopoverTrigger
    class="inline-flex items-center justify-start rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
  >
    {displayText}
  </PopoverTrigger>
  <PopoverContent class="w-[200px] p-0" align="start">
    <Command>
      <CommandList>
        {#each groupByOptions as option (option.value)}
          <CommandItem
            onSelect={() => handleSelect(option.value)}
            class="flex items-center gap-2 cursor-pointer"
          >
            <Check
              class="h-4 w-4 {selectedGroupBy === option.value ? 'opacity-100' : 'opacity-0'}"
            />
            <span>{option.label}</span>
          </CommandItem>
        {/each}
      </CommandList>
    </Command>
  </PopoverContent>
</Popover>
