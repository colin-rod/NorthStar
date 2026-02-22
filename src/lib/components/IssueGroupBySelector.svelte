<!-- src/lib/components/IssueGroupBySelector.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { Select, SelectTrigger, SelectContent, SelectItem } from '$lib/components/ui/select';

  interface Props {
    selectedGroupBy: string;
  }

  let { selectedGroupBy }: Props = $props();

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

  function handleSelect(value: string | undefined) {
    if (!value) return;

    const params = new URLSearchParams($page.url.searchParams);

    if (value === 'none') {
      params.delete('group_by');
    } else {
      params.set('group_by', value);
    }

    const newUrl = `${$page.url.pathname}?${params.toString()}`;
    goto(newUrl, { replaceState: false, keepFocus: true, noScroll: true });
  }
</script>

<Select
  selected={{ value: selectedGroupBy, label: selectedOption.label }}
  onSelectedChange={(v) => handleSelect(v?.value)}
>
  <SelectTrigger class="w-[200px]">
    {displayText}
  </SelectTrigger>
  <SelectContent>
    {#each groupByOptions as option (option.value)}
      <SelectItem value={option.value} label={option.label}>
        {option.label}
      </SelectItem>
    {/each}
  </SelectContent>
</Select>
