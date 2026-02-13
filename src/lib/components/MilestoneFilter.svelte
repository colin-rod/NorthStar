<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
  import { Command, CommandInput, CommandList, CommandItem } from '$lib/components/ui/command';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { Separator } from '$lib/components/ui/separator';
  import type { Issue, Milestone } from '$lib/types';

  interface Props {
    milestones: Milestone[];
    selectedMilestoneIds: string[];
    includeNoMilestone: boolean;
    issues: Issue[];
  }

  let { milestones, selectedMilestoneIds, includeNoMilestone, issues }: Props = $props();

  let open = $state(false);
  let searchQuery = $state('');

  // Calculate count for "No Milestone"
  let noMilestoneCount = $derived(issues.filter((i) => i.milestone_id === null).length);

  // Calculate counts for each milestone
  let milestoneCounts = $derived.by(() => {
    const counts = new Map<string, number>();
    for (const milestone of milestones) {
      counts.set(milestone.id, issues.filter((i) => i.milestone_id === milestone.id).length);
    }
    return counts;
  });

  // Calculate progress (done + canceled / total) for each milestone
  let milestoneProgress = $derived.by(() => {
    const progress = new Map<string, { completed: number; total: number; percentage: number }>();
    for (const milestone of milestones) {
      const milestoneIssues = issues.filter((i) => i.milestone_id === milestone.id);
      const total = milestoneIssues.length;
      const completed = milestoneIssues.filter(
        (i) => i.status === 'done' || i.status === 'canceled',
      ).length;
      progress.set(milestone.id, {
        completed,
        total,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      });
    }
    return progress;
  });

  // Sort milestones by due_date (closest first), then alphabetically
  let sortedMilestones = $derived.by(() => {
    return [...milestones].sort((a, b) => {
      // Both have due dates
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      // Only a has due date (a comes first)
      if (a.due_date) return -1;
      // Only b has due date (b comes first)
      if (b.due_date) return 1;
      // Neither has due date, sort alphabetically
      return a.name.localeCompare(b.name);
    });
  });

  // Filtered milestones based on search (doesn't affect "No Milestone")
  let filteredMilestones = $derived(
    sortedMilestones.filter((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  // Display text for trigger button
  let buttonText = $derived.by(() => {
    const totalSelected = selectedMilestoneIds.length + (includeNoMilestone ? 1 : 0);

    if (totalSelected === 0) {
      return 'Milestone';
    }
    if (totalSelected === 1) {
      if (includeNoMilestone) {
        return 'Milestone: No Milestone';
      }
      const milestone = milestones.find((m) => m.id === selectedMilestoneIds[0]);
      return `Milestone: ${milestone?.name || 'Unknown'}`;
    }
    return `Milestone (${totalSelected})`;
  });

  function toggleNoMilestone() {
    updateURL(selectedMilestoneIds, !includeNoMilestone);
  }

  function toggleMilestone(milestoneId: string) {
    const newSelection = selectedMilestoneIds.includes(milestoneId)
      ? selectedMilestoneIds.filter((id) => id !== milestoneId)
      : [...selectedMilestoneIds, milestoneId];

    updateURL(newSelection, includeNoMilestone);
  }

  function updateURL(milestoneIds: string[], includeNone: boolean) {
    const params = new URLSearchParams($page.url.searchParams);

    const parts: string[] = [];
    if (includeNone) parts.push('none');
    parts.push(...milestoneIds);

    if (parts.length === 0) {
      params.delete('milestone');
    } else {
      params.set('milestone', parts.join(','));
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
    class="inline-flex items-center justify-start rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
  >
    {buttonText}
  </PopoverTrigger>
  <PopoverContent class="w-[300px] p-0" align="start">
    <Command>
      <CommandInput placeholder="Search milestones..." bind:value={searchQuery} />
      <CommandList>
        <!-- Special "No Milestone" option (always visible) -->
        <CommandItem
          onSelect={toggleNoMilestone}
          class="flex items-center gap-2 cursor-pointer"
          data-testid="milestone-none-checkbox"
        >
          <Checkbox checked={includeNoMilestone} aria-label="No Milestone" />
          <span class="flex-1">No Milestone</span>
          <span class="text-muted-foreground text-sm">({noMilestoneCount})</span>
        </CommandItem>

        {#if sortedMilestones.length > 0}
          <Separator class="my-1" />
        {/if}

        <!-- Regular milestones (filtered by search) -->
        {#each filteredMilestones as milestone (milestone.id)}
          {@const prog = milestoneProgress.get(milestone.id)}
          <CommandItem
            onSelect={() => toggleMilestone(milestone.id)}
            class="flex flex-col gap-1.5 cursor-pointer"
            data-testid="milestone-checkbox"
          >
            <div class="flex items-center gap-2 w-full">
              <Checkbox
                checked={selectedMilestoneIds.includes(milestone.id)}
                aria-label={milestone.name}
              />
              <span class="flex-1">{milestone.name}</span>
              <span class="text-muted-foreground text-sm">
                {prog?.completed ?? 0}/{prog?.total ?? 0}
              </span>
            </div>
            {#if prog && prog.total > 0}
              <div class="flex items-center gap-2 pl-6 w-full">
                <div class="flex-1 h-[3px] bg-muted rounded-full overflow-hidden">
                  <div
                    class="h-full bg-foreground/40 rounded-full transition-all duration-300"
                    style="width: {prog.percentage}%"
                  ></div>
                </div>
                <span class="text-xs text-muted-foreground shrink-0">{prog.percentage}%</span>
              </div>
            {/if}
          </CommandItem>
        {/each}

        {#if filteredMilestones.length === 0 && searchQuery}
          <div class="py-6 text-center text-sm text-muted-foreground">No milestones found</div>
        {/if}
      </CommandList>
    </Command>
  </PopoverContent>
</Popover>
