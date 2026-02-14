<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
  import { Command, CommandInput, CommandList, CommandItem } from '$lib/components/ui/command';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import type { Issue, IssueStatus } from '$lib/types';

  interface Props {
    selectedStatuses: string[];
    issues: Issue[];
  }

  let { selectedStatuses, issues }: Props = $props();

  let open = $state(false);
  let searchQuery = $state('');

  // Status options with labels
  const statuses: { value: IssueStatus; label: string }[] = [
    { value: 'todo', label: 'Todo' },
    { value: 'doing', label: 'In Progress' },
    { value: 'in_review', label: 'In Review' },
    { value: 'done', label: 'Done' },
    { value: 'canceled', label: 'Canceled' },
  ];

  // Calculate counts for each status
  let statusCounts = $derived.by(() => {
    const counts = new Map<IssueStatus, number>();
    for (const status of statuses) {
      counts.set(status.value, issues.filter((i) => i.status === status.value).length);
    }
    return counts;
  });

  // Filtered statuses based on search
  let filteredStatuses = $derived(
    statuses.filter((s) => s.label.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  // Display text for trigger button
  let buttonText = $derived.by(() => {
    if (selectedStatuses.length === 0) {
      return 'Status';
    }
    if (selectedStatuses.length === 1) {
      const statusObj = statuses.find((s) => s.value === selectedStatuses[0]);
      return `Status: ${statusObj?.label}`;
    }
    return `Status (${selectedStatuses.length})`;
  });

  function toggleStatus(status: IssueStatus) {
    const newSelection = selectedStatuses.includes(status)
      ? selectedStatuses.filter((s) => s !== status)
      : [...selectedStatuses, status];

    updateURL(newSelection);
  }

  function updateURL(statuses: string[]) {
    const params = new URLSearchParams($page.url.searchParams);

    if (statuses.length === 0) {
      params.delete('status');
    } else {
      params.set('status', statuses.join(','));
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
      <CommandInput placeholder="Search status..." bind:value={searchQuery} />
      <CommandList>
        {#each filteredStatuses as status (status.value)}
          <CommandItem
            onSelect={() => toggleStatus(status.value)}
            class="flex items-center gap-2 cursor-pointer"
            data-testid="status-checkbox"
          >
            <Checkbox checked={selectedStatuses.includes(status.value)} aria-label={status.label} />
            <span class="flex-1">{status.label}</span>
            <span class="text-muted-foreground text-sm">
              ({statusCounts.get(status.value) || 0})
            </span>
          </CommandItem>
        {/each}
        {#if filteredStatuses.length === 0}
          <div class="py-6 text-center text-sm text-muted-foreground">No statuses found</div>
        {/if}
      </CommandList>
    </Command>
  </PopoverContent>
</Popover>
