<script lang="ts">
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';

  interface Props {
    groupName: string;
    issueCount: number;
    totalStoryPoints: number;
    completionPercent: number;
    isExpanded: boolean;
    onclick?: () => void;
  }

  let { groupName, issueCount, totalStoryPoints, completionPercent, isExpanded, onclick }: Props =
    $props();

  // Format completion percentage
  let formattedCompletion = $derived(Math.round(completionPercent));
</script>

{#snippet content()}
  <!-- Chevron -->
  {#if isExpanded}
    <ChevronDown aria-hidden="true" class="h-4 w-4 text-foreground-muted" />
  {:else}
    <ChevronRight aria-hidden="true" class="h-4 w-4 text-foreground-muted" />
  {/if}

  <!-- Group Name -->
  <span class="font-medium text-body">{groupName}</span>

  <!-- Separator -->
  <span aria-hidden="true" class="text-foreground-muted">—</span>

  <!-- Issue Count -->
  <span class="text-metadata text-foreground-muted">
    {issueCount}
    {issueCount === 1 ? 'issue' : 'issues'}
  </span>

  <!-- Story Points (if any) -->
  {#if totalStoryPoints > 0}
    <span class="text-metadata text-foreground-muted">, {totalStoryPoints} story points</span>
  {/if}

  <!-- Completion % -->
  <span class="text-metadata text-foreground-muted">, {formattedCompletion}% complete</span>
{/snippet}

{#if onclick}
  <button
    type="button"
    {onclick}
    aria-expanded={isExpanded}
    class="flex w-full items-center gap-2 px-4 py-3 hover:bg-surface-subtle transition-colors cursor-pointer"
  >
    {@render content()}
  </button>
{:else}
  <div
    class="flex items-center gap-2 px-4 py-3 hover:bg-surface-subtle transition-colors cursor-pointer"
  >
    {@render content()}
  </div>
{/if}
