<script lang="ts">
  import type { Issue } from '$lib/types';
  import { Badge } from '$lib/components/ui/badge';
  import AddDependencyDialog from '$lib/components/AddDependencyDialog.svelte';
  import X from '@lucide/svelte/icons/x';
  import Lock from '@lucide/svelte/icons/lock';
  import { invalidateAll } from '$app/navigation';
  import { supabase } from '$lib/supabase';
  import { getBlockingDependencies, getSatisfiedDependencies } from '$lib/utils/issue-helpers';
  import { getStatusBadgeVariant, formatStatus } from '$lib/utils/design-tokens';
  import { toast } from 'svelte-sonner';

  // Props
  let {
    issue,
    projectIssues = [],
    blockedByIssues = [],
    blockingIssues = [],
  }: {
    issue: Issue;
    projectIssues: Issue[];
    blockedByIssues: Issue[];
    blockingIssues: Issue[];
  } = $props();

  // Compute blocking vs satisfied dependencies
  let blockingDeps = $derived(
    blockedByIssues.filter((dep) => dep.status !== 'done' && dep.status !== 'canceled'),
  );
  let satisfiedDeps = $derived(
    blockedByIssues.filter((dep) => dep.status === 'done' || dep.status === 'canceled'),
  );

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
      toast.error('Failed to remove dependency', {
        duration: 5000,
      });
      console.error('Remove dependency error:', err);
    }
  }
</script>

<section>
  <h3 class="text-xs uppercase font-medium text-foreground-muted mb-2 tracking-wide">
    Dependencies
  </h3>
  <div class="space-y-4">
    <!-- Blocking Summary -->
    {#if blockingDeps.length > 0}
      <div class="flex items-center gap-1 text-sm text-destructive font-medium mb-2">
        <Lock class="h-4 w-4" />
        Blocked by {blockingDeps.length}
        {blockingDeps.length === 1 ? 'dependency' : 'dependencies'}
      </div>
    {/if}

    <!-- Blocking Dependencies -->
    {#if blockingDeps.length > 0}
      <div>
        <p class="text-metadata text-foreground-muted mb-2">Waiting on:</p>
        <div class="space-y-2">
          {#each blockingDeps as dep (dep.id)}
            <div class="group flex items-center gap-2 p-2 rounded-md bg-muted/50">
              <Badge variant={getStatusBadgeVariant(dep.status)} class="shrink-0">
                {formatStatus(dep.status)}
              </Badge>
              <span class="text-body flex-1 truncate">{dep.title}</span>
              <span class="text-metadata text-foreground-muted shrink-0">
                {dep.epic?.name}
              </span>
              <button
                type="button"
                onclick={() => removeDependency(dep.id)}
                class="shrink-0 text-foreground-muted hover:text-destructive transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
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
              <Badge variant={getStatusBadgeVariant(dep.status)} class="shrink-0">
                {formatStatus(dep.status)}
              </Badge>
              <span class="text-body flex-1 truncate">{dep.title}</span>
              <span class="text-metadata text-foreground-muted shrink-0">
                {dep.epic?.name}
              </span>
              <button
                type="button"
                onclick={() => removeDependency(dep.id)}
                class="shrink-0 text-foreground-muted hover:text-destructive transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
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
      <p class="text-sm text-foreground-muted py-1">No dependencies</p>
    {/if}

    <!-- Blocking -->
    {#if blockingIssues.length > 0}
      <div>
        <p class="text-metadata text-foreground-muted mb-2">Blocking:</p>
        <div class="space-y-2">
          {#each blockingIssues as blocked (blocked.id)}
            <div class="flex items-center gap-2 p-2 rounded-md bg-muted/50">
              <Badge variant={getStatusBadgeVariant(blocked.status)} class="shrink-0">
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

    <!-- Add Dependency -->
    <AddDependencyDialog {issue} {projectIssues} {blockedByIssues} {blockingIssues} />
  </div>
</section>
