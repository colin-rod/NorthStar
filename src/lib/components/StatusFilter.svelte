<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
  import { Command, CommandInput, CommandList, CommandItem } from '$lib/components/ui/command';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { Separator } from '$lib/components/ui/separator';
  import type { Issue, IssueStatus } from '$lib/types';
  import { isReady, isBlocked } from '$lib/utils/issue-helpers';
  import { ISSUE_STATUS_LABELS } from '$lib/utils/status-labels';
  import SearchX from '@lucide/svelte/icons/search-x';

  interface Props {
    selectedStatuses: string[];
    issues: Issue[];
  }

  let { selectedStatuses, issues }: Props = $props();

  let open = $state(false);
  let searchQuery = $state('');

  type StatusOption = {
    value: string;
    label: string;
    description?: string;
    section: 'computed' | 'raw';
  };

  // Computed statuses (virtual) + raw database statuses
  const allOptions: StatusOption[] = [
    {
      value: 'ready',
      label: 'Ready',
      description: 'Todo with nothing blocking',
      section: 'computed',
    },
    {
      value: 'blocked',
      label: 'Blocked',
      description: 'Waiting on other issues',
      section: 'computed',
    },
    { value: 'backlog', label: ISSUE_STATUS_LABELS.backlog, section: 'raw' },
    { value: 'todo', label: 'Todo (all)', description: 'Including blocked issues', section: 'raw' },
    { value: 'in_progress', label: ISSUE_STATUS_LABELS.in_progress, section: 'raw' },
    { value: 'in_review', label: ISSUE_STATUS_LABELS.in_review, section: 'raw' },
    { value: 'done', label: ISSUE_STATUS_LABELS.done, section: 'raw' },
    { value: 'canceled', label: ISSUE_STATUS_LABELS.canceled, section: 'raw' },
  ];

  // Calculate counts for each option
  let optionCounts = $derived.by(() => {
    const counts = new Map<string, number>();
    counts.set('ready', issues.filter((i) => isReady(i)).length);
    counts.set('blocked', issues.filter((i) => isBlocked(i)).length);
    counts.set('backlog', issues.filter((i) => i.status === 'backlog').length);
    counts.set('todo', issues.filter((i) => i.status === 'todo').length);
    counts.set('in_progress', issues.filter((i) => i.status === 'in_progress').length);
    counts.set('in_review', issues.filter((i) => i.status === 'in_review').length);
    counts.set('done', issues.filter((i) => i.status === 'done').length);
    counts.set('canceled', issues.filter((i) => i.status === 'canceled').length);
    return counts;
  });

  // Filtered options based on search
  let filteredOptions = $derived(
    allOptions.filter((s) => s.label.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  let filteredComputed = $derived(filteredOptions.filter((s) => s.section === 'computed'));
  let filteredRaw = $derived(filteredOptions.filter((s) => s.section === 'raw'));

  let isActive = $derived(selectedStatuses.length > 0);

  // Display text for trigger button
  let buttonText = $derived.by(() => {
    if (selectedStatuses.length === 0) {
      return 'Status';
    }
    if (selectedStatuses.length === 1) {
      const opt = allOptions.find((s) => s.value === selectedStatuses[0]);
      return `Status: ${opt?.label}`;
    }
    return `Status (${selectedStatuses.length})`;
  });

  function toggleStatus(status: string) {
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
    class={[
      'inline-flex items-center justify-start rounded-md border px-4 py-2 text-sm font-medium',
      isActive
        ? 'bg-primary/10 border-primary text-primary hover:bg-primary/20'
        : 'border-input bg-background hover:bg-accent hover:text-accent-foreground',
    ].join(' ')}
  >
    {buttonText}
  </PopoverTrigger>
  <PopoverContent class="w-[280px] p-0" align="start">
    <Command>
      <CommandInput placeholder="Search status..." bind:value={searchQuery} />
      <CommandList>
        {#each filteredComputed as option (option.value)}
          <CommandItem
            onSelect={() => toggleStatus(option.value)}
            class="flex items-center gap-2 cursor-pointer"
            data-testid="status-checkbox"
          >
            <Checkbox checked={selectedStatuses.includes(option.value)} aria-label={option.label} />
            <div class="flex-1 flex flex-col">
              <span>{option.label}</span>
              {#if option.description}
                <span class="text-xs text-muted-foreground">{option.description}</span>
              {/if}
            </div>
            <span class="text-muted-foreground text-sm">
              ({optionCounts.get(option.value) || 0})
            </span>
          </CommandItem>
        {/each}
        {#if filteredComputed.length > 0 && filteredRaw.length > 0}
          <Separator />
        {/if}
        {#each filteredRaw as option (option.value)}
          <CommandItem
            onSelect={() => toggleStatus(option.value)}
            class="flex items-center gap-2 cursor-pointer"
            data-testid="status-checkbox"
          >
            <Checkbox checked={selectedStatuses.includes(option.value)} aria-label={option.label} />
            <div class="flex-1 flex flex-col">
              <span>{option.label}</span>
              {#if option.description}
                <span class="text-xs text-muted-foreground">{option.description}</span>
              {/if}
            </div>
            <span class="text-muted-foreground text-sm">
              ({optionCounts.get(option.value) || 0})
            </span>
          </CommandItem>
        {/each}
        {#if filteredOptions.length === 0}
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
