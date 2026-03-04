<!-- src/lib/components/EpicStatusFilter.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
  import { Command, CommandList, CommandItem } from '$lib/components/ui/command';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import type { EpicStatus } from '$lib/types';

  interface Props {
    selectedStatuses: EpicStatus[];
  }

  let { selectedStatuses }: Props = $props();

  let open = $state(false);

  const statusOptions: { value: EpicStatus; label: string }[] = [
    { value: 'backlog', label: 'Backlog' },
    { value: 'active', label: 'Active' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'completed', label: 'Completed' },
    { value: 'canceled', label: 'Canceled' },
  ];

  let buttonText = $derived(
    selectedStatuses.length === 0 ? 'Epic Status' : `Epic Status (${selectedStatuses.length})`,
  );

  function toggleStatus(status: EpicStatus) {
    const newSelection = selectedStatuses.includes(status)
      ? selectedStatuses.filter((s) => s !== status)
      : [...selectedStatuses, status];

    updateURL(newSelection);
  }

  function updateURL(statuses: EpicStatus[]) {
    const params = new URLSearchParams($page.url.searchParams);

    if (statuses.length === 0) {
      params.delete('epic_status');
    } else {
      params.set('epic_status', statuses.join(','));
    }

    const newUrl = `${$page.url.pathname}?${params.toString()}`;
    goto(newUrl, { replaceState: false, keepFocus: true, noScroll: true });
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
        {#each statusOptions as option (option.value)}
          <CommandItem
            onSelect={() => toggleStatus(option.value)}
            class="flex items-center gap-2 cursor-pointer"
          >
            <Checkbox checked={selectedStatuses.includes(option.value)} aria-label={option.label} />
            <span>{option.label}</span>
          </CommandItem>
        {/each}
      </CommandList>
    </Command>
  </PopoverContent>
</Popover>
