<script lang="ts">
  import type { Issue } from '$lib/types';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import AddDependencyDialog from '$lib/components/AddDependencyDialog.svelte';
  import { X } from 'lucide-svelte';
  import { invalidateAll } from '$app/navigation';
  import { createClient } from '$lib/supabase';

  // Props
  let {
    issue,
    allIssues = [],
    blockedByIssues = [],
    blockingIssues = [],
    saveError = $bindable<string | null>(null),
  }: {
    issue: Issue;
    allIssues: Issue[];
    blockedByIssues: Issue[];
    blockingIssues: Issue[];
    saveError?: string | null;
  } = $props();

  // Local state
  let dialogOpen = $state(false);

  // Helper to get status badge variant
  function getStatusVariant(status: string) {
    const variantMap: Record<string, string> = {
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
      const supabase = createClient();

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
    <!-- Blocked By -->
    {#if blockedByIssues.length > 0}
      <div>
        <p class="text-metadata text-foreground-muted mb-2">Blocked by:</p>
        <div class="space-y-2">
          {#each blockedByIssues as dep (dep.id)}
            <div class="group flex items-center gap-2 p-2 rounded-md bg-muted/50">
              <Badge variant={getStatusVariant(dep.status)} class="shrink-0">
                {formatStatus(dep.status)}
              </Badge>
              <span class="text-body flex-1 truncate">{dep.title}</span>
              <span class="text-metadata text-foreground-muted shrink-0">
                {dep.epic?.name}
              </span>
              <!-- X button: visible on hover (desktop) or always (mobile) -->
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
    {:else}
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
  {allIssues}
  {blockedByIssues}
  {blockingIssues}
/>
