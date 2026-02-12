<script lang="ts">
  import type { Issue } from '$lib/types';
  import { Sheet, SheetContent, SheetHeader, SheetTitle } from '$lib/components/ui/sheet';
  import { Input } from '$lib/components/ui/input';
  import { Badge } from '$lib/components/ui/badge';
  import { invalidateAll } from '$app/navigation';
  import { supabase } from '$lib/supabase';

  // Props
  let {
    open = $bindable(false),
    issue = $bindable<Issue | null>(null),
    allIssues = [],
    blockedByIssues = [],
    blockingIssues = [],
  }: {
    open: boolean;
    issue: Issue | null;
    allIssues: Issue[];
    blockedByIssues: Issue[];
    blockingIssues: Issue[];
  } = $props();

  // Local state
  let searchTerm = $state('');
  let loading = $state(false);
  let error = $state<string | null>(null);

  // Filter available issues (exclude self and existing dependencies)
  let availableIssues = $derived(
    allIssues.filter(
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

  // Helper to get status badge variant
  function getStatusVariant(
    status: string,
  ):
    | 'status-todo'
    | 'status-doing'
    | 'status-in-review'
    | 'status-done'
    | 'status-canceled'
    | undefined {
    const variantMap: Record<
      string,
      'status-todo' | 'status-doing' | 'status-in-review' | 'status-done' | 'status-canceled'
    > = {
      todo: 'status-todo',
      doing: 'status-doing',
      in_review: 'status-in-review',
      done: 'status-done',
      canceled: 'status-canceled',
    };
    return variantMap[status];
  }

  // Format status for display
  function formatStatus(status: string): string {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Add dependency handler
  async function addDependency(dependsOnIssueId: string) {
    if (!issue) return;

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
      searchTerm = '';
    } catch (err) {
      error = 'Failed to add dependency';
      console.error('Add dependency error:', err);
    } finally {
      loading = false;
    }
  }
</script>

<Sheet bind:open>
  <SheetContent side="bottom" class="max-h-[85vh] overflow-hidden flex flex-col">
    <SheetHeader class="mb-4">
      <SheetTitle class="font-accent text-page-title">Add Dependency</SheetTitle>
    </SheetHeader>

    <!-- Error Banner -->
    {#if error}
      <div
        class="mb-4 p-3 rounded-md bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 text-sm"
      >
        {error}
      </div>
    {/if}

    <!-- Search Input -->
    <div class="mb-4">
      <Input
        value={searchTerm}
        oninput={(e: Event) => (searchTerm = (e.target as HTMLInputElement).value)}
        placeholder="Search issues..."
        disabled={loading}
        class="text-body"
      />
    </div>

    <!-- Results List -->
    <div class="flex-1 overflow-y-auto space-y-2">
      {#if filteredIssues.length === 0}
        <p class="text-metadata text-foreground-muted text-center py-8">
          {searchTerm ? 'No matching issues found' : 'No available issues'}
        </p>
      {:else}
        {#each filteredIssues as availableIssue (availableIssue.id)}
          <button
            type="button"
            onclick={() => addDependency(availableIssue.id)}
            disabled={loading}
            class="w-full flex items-center gap-2 p-3 rounded-md bg-muted/50 hover:bg-muted text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Badge variant={getStatusVariant(availableIssue.status)} class="shrink-0">
              P{availableIssue.priority}
            </Badge>
            <div class="flex-1 min-w-0">
              <p class="text-body truncate">{availableIssue.title}</p>
              <p class="text-metadata text-foreground-muted truncate">
                {availableIssue.project?.name || 'Project'} • {availableIssue.epic?.name || 'Epic'}
              </p>
            </div>
          </button>
        {/each}
      {/if}
    </div>

    <!-- Footer -->
    <div class="mt-4 pt-4 border-t border-border">
      <p class="text-metadata text-foreground-muted text-center">
        Showing {filteredIssues.length} issue{filteredIssues.length !== 1 ? 's' : ''}
      </p>
    </div>
  </SheetContent>
</Sheet>
