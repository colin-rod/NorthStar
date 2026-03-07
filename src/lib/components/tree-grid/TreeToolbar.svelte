<script lang="ts">
  /**
   * TreeToolbar Component - Breadcrumb + Bulk Actions
   */

  import { Button } from '$lib/components/ui/button';
  import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
  import {
    Command,
    CommandList,
    CommandItem,
    CommandGroup,
    CommandSeparator,
  } from '$lib/components/ui/command';
  import {
    VALID_ISSUE_STATUSES,
    VALID_EPIC_STATUSES,
    VALID_PROJECT_STATUSES,
    VALID_STORY_POINTS,
    VALID_PRIORITIES,
  } from '$lib/constants/validation';
  import {
    ISSUE_STATUS_LABELS,
    EPIC_STATUS_LABELS,
    PROJECT_STATUS_LABELS,
  } from '$lib/utils/status-labels';

  interface Props {
    selectedCount: number;
    breadcrumb: string;
    onBulkAction: (action: string) => void;
    onBulkEdit?: (field: string, value: string) => void;
    milestones?: { id: string; name: string }[];
  }

  let { selectedCount, breadcrumb, onBulkAction, onBulkEdit, milestones = [] }: Props = $props();

  let bulkEditOpen = $state(false);

  // De-duplicated union of all status options (issue order first, then epic/project-only)
  const allStatusValues = [
    ...VALID_ISSUE_STATUSES,
    ...VALID_EPIC_STATUSES,
    ...VALID_PROJECT_STATUSES,
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  const allStatusLabels: Record<string, string> = {
    ...PROJECT_STATUS_LABELS,
    ...EPIC_STATUS_LABELS,
    ...ISSUE_STATUS_LABELS,
  };

  const priorityLabels: Record<number, string> = {
    0: 'P0 — Critical',
    1: 'P1 — High',
    2: 'P2 — Medium',
    3: 'P3 — Low',
  };

  function apply(field: string, value: string) {
    onBulkEdit?.(field, value);
    bulkEditOpen = false;
  }
</script>

<div class="flex items-center justify-between h-11 px-4 border-b border-border-divider bg-surface">
  <!-- Left: Breadcrumb -->
  <div class="flex items-center gap-3">
    {#if breadcrumb}
      <div class="text-sm text-muted-foreground">
        {breadcrumb}
      </div>
    {/if}
  </div>

  <!-- Right: bulk actions -->
  <div class="flex items-center gap-4">
    {#if selectedCount > 0}
      <div class="flex items-center gap-2">
        <span class="text-metadata text-foreground-secondary">{selectedCount} selected</span>

        <Popover bind:open={bulkEditOpen}>
          <PopoverTrigger>
            {#snippet child({ props })}
              <Button size="sm" variant="outline" {...props}>Bulk edit</Button>
            {/snippet}
          </PopoverTrigger>
          <PopoverContent class="w-[220px] p-0" align="end">
            <Command>
              <CommandList>
                <!-- Status -->
                <CommandGroup heading="Status">
                  {#each allStatusValues as status}
                    <CommandItem onSelect={() => apply('status', status)} class="cursor-pointer">
                      {allStatusLabels[status] ?? status}
                    </CommandItem>
                  {/each}
                </CommandGroup>

                <CommandSeparator />

                <!-- Priority (issues only) -->
                <CommandGroup heading="Priority (issues)">
                  {#each VALID_PRIORITIES as priority}
                    <CommandItem
                      onSelect={() => apply('priority', priority.toString())}
                      class="cursor-pointer"
                    >
                      {priorityLabels[priority]}
                    </CommandItem>
                  {/each}
                </CommandGroup>

                <CommandSeparator />

                <!-- Story Points (issues only) -->
                <CommandGroup heading="Story points (issues)">
                  {#each VALID_STORY_POINTS as pts}
                    <CommandItem
                      onSelect={() => apply('story_points', pts.toString())}
                      class="cursor-pointer"
                    >
                      {pts}
                    </CommandItem>
                  {/each}
                  <CommandItem
                    onSelect={() => apply('story_points', '')}
                    class="cursor-pointer text-muted-foreground"
                  >
                    Clear
                  </CommandItem>
                </CommandGroup>

                {#if milestones.length > 0}
                  <CommandSeparator />

                  <!-- Milestone (issues only) -->
                  <CommandGroup heading="Milestone (issues)">
                    {#each milestones as milestone (milestone.id)}
                      <CommandItem
                        onSelect={() => apply('milestone_id', milestone.id)}
                        class="cursor-pointer"
                      >
                        {milestone.name}
                      </CommandItem>
                    {/each}
                    <CommandItem
                      onSelect={() => apply('milestone_id', '')}
                      class="cursor-pointer text-muted-foreground"
                    >
                      Clear
                    </CommandItem>
                  </CommandGroup>
                {/if}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Button size="sm" variant="outline" onclick={() => onBulkAction('delete')}>Delete</Button>
      </div>
    {/if}
  </div>
</div>
