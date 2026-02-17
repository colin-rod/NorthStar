<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
  import { Command, CommandList, CommandItem } from '$lib/components/ui/command';
  import { Button } from '$lib/components/ui/button';
  import type { SortByColumn, SortDirection } from '$lib/types';
  import ChevronUp from '@lucide/svelte/icons/chevron-up';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';

  interface Props {
    selected: SortByColumn;
    direction: SortDirection;
  }

  let { selected, direction }: Props = $props();

  let open = $state(false);

  const sortOptions: { value: SortByColumn; label: string }[] = [
    { value: 'priority', label: 'Priority' },
    { value: 'status', label: 'Status' },
    { value: 'title', label: 'Title' },
    { value: 'project', label: 'Project' },
    { value: 'epic', label: 'Epic' },
    { value: 'milestone', label: 'Milestone' },
    { value: 'story_points', label: 'Story Points' },
  ];

  let buttonText = $derived.by(() => {
    const option = sortOptions.find((o) => o.value === selected);
    const arrow = direction === 'asc' ? '↑' : '↓';
    return `Sort: ${option?.label} ${arrow}`;
  });

  function selectSortColumn(column: SortByColumn) {
    const params = new URLSearchParams($page.url.searchParams);
    params.set('sort_by', column);

    const newUrl = `${$page.url.pathname}?${params.toString()}`;
    goto(newUrl, { replaceState: false, noScroll: true });
    open = false;
  }

  function toggleDirection() {
    const params = new URLSearchParams($page.url.searchParams);
    const newDirection = direction === 'asc' ? 'desc' : 'asc';
    params.set('sort_dir', newDirection);

    const newUrl = `${$page.url.pathname}?${params.toString()}`;
    goto(newUrl, { replaceState: false, noScroll: true });
  }
</script>

<div class="flex items-center gap-2">
  <Popover bind:open>
    <PopoverTrigger
      class="inline-flex items-center justify-start rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
    >
      {buttonText}
    </PopoverTrigger>
    <PopoverContent class="w-[200px] p-0" align="start">
      <Command>
        <CommandList>
          {#each sortOptions as option (option.value)}
            <CommandItem
              onSelect={() => selectSortColumn(option.value)}
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

  <Button
    variant="outline"
    size="icon"
    onclick={toggleDirection}
    aria-label={direction === 'asc' ? 'Sort ascending' : 'Sort descending'}
  >
    {#if direction === 'asc'}
      <ChevronUp class="h-4 w-4" />
    {:else}
      <ChevronDown class="h-4 w-4" />
    {/if}
  </Button>
</div>
