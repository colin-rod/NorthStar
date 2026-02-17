<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
  import { Command, CommandList, CommandItem } from '$lib/components/ui/command';
  import type { GroupByMode } from '$lib/types';

  interface Props {
    selected: GroupByMode;
  }

  let { selected }: Props = $props();

  let open = $state(false);

  const groupByOptions: { value: GroupByMode; label: string }[] = [
    { value: 'none', label: 'None' },
    { value: 'project', label: 'Project' },
    { value: 'status', label: 'Status' },
    { value: 'priority', label: 'Priority' },
    { value: 'milestone', label: 'Milestone' },
    { value: 'story_points', label: 'Story Points' },
  ];

  let buttonText = $derived.by(() => {
    const option = groupByOptions.find((o) => o.value === selected);
    return `Group by: ${option?.label}`;
  });

  function selectGroupBy(mode: GroupByMode) {
    const params = new URLSearchParams($page.url.searchParams);

    if (mode === 'none') {
      params.delete('group_by');
    } else {
      params.set('group_by', mode);
    }

    const newUrl = `${$page.url.pathname}?${params.toString()}`;
    goto(newUrl, { replaceState: false, noScroll: true });
    open = false;
  }
</script>

<Popover bind:open>
  <PopoverTrigger
    class="inline-flex items-center justify-start rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
  >
    {buttonText}
  </PopoverTrigger>
  <PopoverContent class="w-[200px] p-0" align="start">
    <Command>
      <CommandList>
        {#each groupByOptions as option (option.value)}
          <CommandItem
            onSelect={() => selectGroupBy(option.value)}
            class="cursor-pointer"
            data-selected={selected === option.value}
          >
            {option.label}
          </CommandItem>
        {/each}
      </CommandList>
    </Command>
  </PopoverContent>
</Popover>
