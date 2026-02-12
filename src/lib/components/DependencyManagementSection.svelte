<script lang="ts">
  import type { Issue } from '$lib/types';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import AddDependencyDialog from '$lib/components/AddDependencyDialog.svelte';
  import X from '@lucide/svelte/icons/x';
  import { invalidateAll } from '$app/navigation';
  import { supabase } from '$lib/supabase';
  import { getBlockingDependencies, getSatisfiedDependencies } from '$lib/utils/issue-helpers';

  // Props
  let {
    issue,
    projectIssues = [],
    blockedByIssues = [],
    blockingIssues = [],
    saveError = $bindable<string | null>(null),
  }: {
    issue: Issue;
    projectIssues: Issue[];
    blockedByIssues: Issue[];
    blockingIssues: Issue[];
    saveError?: string | null;
  } = $props();

  // Compute blocking vs satisfied dependencies
  let blockingDeps = $derived(
    blockedByIssues.filter((dep) => dep.status !== 'done' && dep.status !== 'canceled'),
  );
  let satisfiedDeps = $derived(
    blockedByIssues.filter((dep) => dep.status === 'done' || dep.status === 'canceled'),
  );

  // Local state
  let dialogOpen = $state(false);

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

  // Remove dependency handler
  async function removeDependency(dependsOnIssueId: string) {
    try {
      const { error } = await supabase
        .from('dependencies')
        .delete()
        .eq('issue_id', issue.id)
        .eq('depends_on_issue_id', dependsOnIssueId);

      if (error) throw error;

      await invalidateAll();
    } catch (err) {
      saveError = 'Failed to remove dependency';
      setTimeout(() => (saveError = null), 5000);
      console.error('Remove dependency error:', err);
    }
  }
</script>

<section>
  <h3 class="text-xs uppercase font-medium text-foreground-muted mb-3 tracking-wide">
    Dependencies
  </h3>
  <div class="space-y-4">
    <!-- Blocking Summary -->
    {#if blockingDeps.length > 0}
      <div class="text-sm text-destructive font-medium mb-2">
        🔒 Blocked by {blockingDeps.length}
        {blockingDeps.length === 1 ? 'dependency' : 'dependencies'}
      </div>
    {/if}

    <!-- Blocking Dependencies -->
    {#if blockingDeps.length > 0}
      <div>
        <p class="text-metadata text-foreground-muted mb-2">Blocked by:</p>
        <div class="space-y-2">
          {#each blockingDeps as dep (dep.id)}
            <div class="group flex items-center gap-2 p-2 rounded-md bg-muted/50">
              <Badge variant={getStatusVariant(dep.status)} class="shrink-0">
                {formatStatus(dep.status)}
              </Badge>
              <span class="text-body flex-1 truncate">{dep.title}</span>
              <span class="text-metadata text-foreground-muted shrink-0">
                {dep.epic?.name}
              </span>
              <button
                type="button"
                onclick={() => removeDependency(dep.id)}
                class="shrink-0 text-foreground-muted hover:text-destructive transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
                aria-label="Remove dependency"
              >
                <X class="h-4 w-4" />
              </button>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Satisfied Dependencies -->
    {#if satisfiedDeps.length > 0}
      <div>
        <p class="text-metadata text-foreground-muted mb-2">Satisfied dependencies</p>
        <div class="space-y-2">
          {#each satisfiedDeps as dep (dep.id)}
            <div class="group flex items-center gap-2 p-2 rounded-md bg-muted/50">
              <Badge variant={getStatusVariant(dep.status)} class="shrink-0">
                {formatStatus(dep.status)}
              </Badge>
              <span class="text-body flex-1 truncate">{dep.title}</span>
              <span class="text-metadata text-foreground-muted shrink-0">
                {dep.epic?.name}
              </span>
              <button
                type="button"
                onclick={() => removeDependency(dep.id)}
                class="shrink-0 text-foreground-muted hover:text-destructive transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
                aria-label="Remove dependency"
              >
                <X class="h-4 w-4" />
              </button>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- No dependencies message -->
    {#if blockedByIssues.length === 0}
      <p class="text-metadata text-foreground-muted">No blocking dependencies</p>
    {/if}

    <!-- Blocking -->
    {#if blockingIssues.length > 0}
      <div>
        <p class="text-metadata text-foreground-muted mb-2">Blocking:</p>
        <div class="space-y-2">
          {#each blockingIssues as blocked (blocked.id)}
            <div class="flex items-center gap-2 p-2 rounded-md bg-muted/50">
              <Badge variant={getStatusVariant(blocked.status)} class="shrink-0">
                {formatStatus(blocked.status)}
              </Badge>
              <span class="text-body flex-1 truncate">{blocked.title}</span>
              <span class="text-metadata text-foreground-muted shrink-0">
                {blocked.epic?.name}
              </span>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Add Dependency Button -->
    <Button variant="outline" size="sm" onclick={() => (dialogOpen = true)} class="w-full">
      Add Dependency
    </Button>
  </div>
</section>

<!-- Add Dependency Dialog -->
<AddDependencyDialog
  bind:open={dialogOpen}
  {issue}
  {projectIssues}
  {blockedByIssues}
  {blockingIssues}
/>
