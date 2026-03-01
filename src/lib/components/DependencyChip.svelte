<script lang="ts">
  /**
   * DependencyChip Component
   *
   * Compact inline chip that shows dependency status for an issue.
   * Expands into a floating popover on hover (desktop) or tap (mobile)
   * showing all dependencies with navigation to each one.
   */

  import type { Issue } from '$lib/types';
  import { getBlockingDependencies, getSatisfiedDependencies } from '$lib/utils/issue-helpers';
  import { openIssueSheet } from '$lib/stores/issues';
  import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
  import Lock from '@lucide/svelte/icons/lock';
  import CircleCheck from '@lucide/svelte/icons/circle-check';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';

  interface Props {
    issue: Issue;
  }

  let { issue }: Props = $props();

  let blockingDeps = $derived(getBlockingDependencies(issue));
  let satisfiedDeps = $derived(getSatisfiedDependencies(issue));
  let totalDeps = $derived(blockingDeps.length + satisfiedDeps.length);
  let hasBlockers = $derived(blockingDeps.length > 0);

  // Status dot color mapping
  const getStatusDotColor = (status: string) => {
    const colors: Record<string, string> = {
      todo: 'bg-status-todo',
      doing: 'bg-status-doing',
      in_review: 'bg-status-in-review',
      done: 'bg-status-done',
      canceled: 'bg-status-canceled',
    };
    return colors[status] || 'bg-status-todo';
  };

  const formatStatus = (status: string) =>
    status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

  function handleDepClick(dep: Issue, event: MouseEvent) {
    event.stopPropagation();
    openIssueSheet(dep);
  }
</script>

{#if totalDeps > 0}
  <Popover>
    <PopoverTrigger>
      {#if hasBlockers}
        <button
          type="button"
          data-testid="dependency-chip"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-status-blocked/15 text-status-blocked-strong border border-status-blocked/30 hover:bg-status-blocked/25 transition-colors cursor-pointer"
          onclick={(e) => e.stopPropagation()}
        >
          <Lock class="h-3 w-3" />
          {blockingDeps.length} blocked
        </button>
      {:else}
        <button
          type="button"
          data-testid="dependency-chip"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border-divider hover:bg-surface-subtle transition-colors cursor-pointer"
          onclick={(e) => e.stopPropagation()}
        >
          <CircleCheck class="h-3 w-3" />
          {satisfiedDeps.length} dep{satisfiedDeps.length !== 1 ? 's' : ''}
        </button>
      {/if}
    </PopoverTrigger>

    <PopoverContent class="w-64 p-0" align="start" sideOffset={8}>
      <div class="p-3 space-y-2" data-testid="dependency-popover">
        <!-- Blocking dependencies -->
        {#if blockingDeps.length > 0}
          <div>
            <p class="text-xs font-medium text-status-blocked-strong mb-1.5">
              Blocked by ({blockingDeps.length})
            </p>
            <div class="space-y-1">
              {#each blockingDeps as dep (dep.id)}
                <button
                  type="button"
                  class="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-subtle transition-colors text-left group/dep"
                  onclick={(e) => handleDepClick(dep, e)}
                >
                  <div
                    class={`w-2 h-2 rounded-full shrink-0 ${getStatusDotColor(dep.status)}`}
                  ></div>
                  <span class="text-xs text-muted-foreground font-mono shrink-0"
                    >I-{dep.number}</span
                  >
                  <span class="text-xs truncate flex-1">{dep.title}</span>
                  <ArrowRight
                    class="h-3 w-3 text-muted-foreground opacity-0 group-hover/dep:opacity-100 transition-opacity shrink-0"
                  />
                </button>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Satisfied dependencies -->
        {#if satisfiedDeps.length > 0}
          <div>
            <p class="text-xs font-medium text-muted-foreground mb-1.5">
              Satisfied ({satisfiedDeps.length})
            </p>
            <div class="space-y-1">
              {#each satisfiedDeps as dep (dep.id)}
                <button
                  type="button"
                  class="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-subtle transition-colors text-left group/dep"
                  onclick={(e) => handleDepClick(dep, e)}
                >
                  <div
                    class={`w-2 h-2 rounded-full shrink-0 ${getStatusDotColor(dep.status)}`}
                  ></div>
                  <span class="text-xs text-muted-foreground font-mono shrink-0"
                    >I-{dep.number}</span
                  >
                  <span class="text-xs truncate flex-1 text-muted-foreground">{dep.title}</span>
                  <ArrowRight
                    class="h-3 w-3 text-muted-foreground opacity-0 group-hover/dep:opacity-100 transition-opacity shrink-0"
                  />
                </button>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </PopoverContent>
  </Popover>
{/if}
