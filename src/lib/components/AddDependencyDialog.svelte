<script lang="ts">
  import type { Issue } from '$lib/types';
  import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Badge } from '$lib/components/ui/badge';
  import { invalidateAll } from '$app/navigation';
  import { supabase } from '$lib/supabase';
  import { getStatusBadgeVariant } from '$lib/utils/design-tokens';
  import EmptyState from '$lib/components/EmptyState.svelte';
  import SearchX from '@lucide/svelte/icons/search-x';
  import Link from '@lucide/svelte/icons/link';

  // Props
  let {
    issue = $bindable<Issue | null>(null),
    projectIssues = [],
    blockedByIssues = [],
    blockingIssues = [],
  }: {
    issue: Issue | null;
    projectIssues: Issue[];
    blockedByIssues: Issue[];
    blockingIssues: Issue[];
  } = $props();

  // Local state
  let open = $state(false);
  let searchTerm = $state('');
  let loading = $state(false);
  let adding = $state(false);
  let error = $state<string | null>(null);

  // Filter available issues (exclude self and existing dependencies)
  let availableIssues = $derived(
    projectIssues.filter(
      (i) =>
        i.id !== issue?.id &&
        !blockedByIssues.some((dep) => dep.id === i.id) &&
        !blockingIssues.some((block) => block.id === i.id),
    ),
  );

  // Filter by search term
  let filteredIssues = $derived(
    searchTerm.trim() === ''
      ? availableIssues
      : availableIssues.filter((i) => i.title.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  // Clear error when search term changes
  $effect(() => {
    if (searchTerm) {
      error = null;
    }
  });

  // Reset state when popover closes
  $effect(() => {
    if (!open) {
      searchTerm = '';
      error = null;
    }
  });

  // Add dependency handler
  async function addDependency(dependsOnIssueId: string) {
    if (!issue || adding) return;

    adding = true;
    loading = true;
    error = null;

    try {
      // 1. Check for cycles using DB function
      const { data: wouldCycle, error: cycleError } = await supabase.rpc('check_dependency_cycle', {
        new_issue_id: issue.id,
        new_depends_on_id: dependsOnIssueId,
      });

      if (cycleError) throw cycleError;

      // 2. If cycle detected, show error (don't close)
      if (wouldCycle) {
        error = 'Cannot add: this would create a circular dependency';
        return;
      }

      // 3. Insert dependency
      const { error: insertError } = await supabase.from('dependencies').insert({
        issue_id: issue.id,
        depends_on_issue_id: dependsOnIssueId,
      });

      if (insertError) throw insertError;

      // 4. Success: refresh and close
      await invalidateAll();
      open = false;
    } catch (err) {
      error = 'Failed to add dependency';
      console.error('Add dependency error:', err);
    } finally {
      loading = false;
      adding = false;
    }
  }
</script>

<Popover bind:open>
  <PopoverTrigger>
    <Button variant="outline" size="sm" class="w-full">Add Dependency</Button>
  </PopoverTrigger>
  <PopoverContent class="w-80 p-3" align="start">
    <!-- Error Banner -->
    {#if error}
      <div class="mb-3 p-2 rounded-md bg-destructive/10 text-destructive text-sm">
        {error}
      </div>
    {/if}

    <!-- Search Input -->
    <div class="mb-3">
      <label for="dep-search" class="sr-only">Search issues</label>
      <Input
        id="dep-search"
        value={searchTerm}
        oninput={(e: Event) => (searchTerm = (e.target as HTMLInputElement).value)}
        placeholder="Search issues..."
        disabled={loading}
        class="text-body h-8"
      />
    </div>

    <!-- Results List -->
    <div class="max-h-56 overflow-y-auto space-y-1">
      {#if filteredIssues.length === 0}
        {#if searchTerm}
          <EmptyState
            icon={SearchX}
            title="No matching issues"
            description="Try a different search term"
            variant="subtle"
          />
        {:else}
          <EmptyState
            icon={Link}
            title="No available issues"
            description="All other issues are already linked"
            variant="subtle"
          />
        {/if}
      {:else}
        {#each filteredIssues as availableIssue (availableIssue.id)}
          <button
            type="button"
            onclick={() => addDependency(availableIssue.id)}
            disabled={loading}
            class="w-full flex items-center gap-2 p-2 rounded-md hover:bg-muted text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Badge variant={getStatusBadgeVariant(availableIssue.status)} class="shrink-0 text-xs">
              P{availableIssue.priority}
            </Badge>
            <div class="flex-1 min-w-0">
              <p class="text-body text-sm truncate">{availableIssue.title}</p>
              <p class="text-xs text-foreground-muted truncate">
                {availableIssue.project?.name || 'Project'} • {availableIssue.epic?.name || 'Epic'}
              </p>
            </div>
          </button>
        {/each}
      {/if}
    </div>
  </PopoverContent>
</Popover>
