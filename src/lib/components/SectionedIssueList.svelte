<script lang="ts">
  import type { Issue } from '$lib/types';
  import { isReady, isBlocked } from '$lib/utils/issue-helpers';
  import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
  } from '$lib/components/ui/collapsible';
  import IssueList from '$lib/components/IssueList.svelte';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';

  interface Props {
    issues: Issue[];
    onIssueClick: (issue: Issue) => void;
  }

  let { issues, onIssueClick }: Props = $props();

  let urgentOpen = $state(true);
  let readyOpen = $state(true);
  let inProgressOpen = $state(true);
  let blockedOpen = $state(true);

  let urgent = $derived(issues.filter((i) => (i.priority === 0 || i.priority === 1) && isReady(i)));
  let ready = $derived(issues.filter((i) => (i.priority === 2 || i.priority === 3) && isReady(i)));
  let inProgress = $derived(
    issues.filter((i) => i.status === 'in_progress' || i.status === 'in_review'),
  );
  let blocked = $derived(issues.filter((i) => isBlocked(i) && i.status === 'todo'));
</script>

{#snippet sectionHeader(label: string, count: number, isOpen: boolean, accentClass: string)}
  <div
    class="flex items-center gap-2 px-4 py-3 hover:bg-surface-subtle transition-colors cursor-pointer border-l-[3px] {accentClass}"
  >
    {#if isOpen}
      <ChevronDown class="h-4 w-4 text-foreground-muted" />
    {:else}
      <ChevronRight class="h-4 w-4 text-foreground-muted" />
    {/if}
    <span class="font-semibold text-body">{label}</span>
    <span class="text-foreground-muted">—</span>
    <span class="text-metadata text-foreground-muted"
      >{count} {count === 1 ? 'issue' : 'issues'}</span
    >
  </div>
{/snippet}

<div class="space-y-2">
  {#if urgent.length > 0}
    <Collapsible bind:open={urgentOpen}>
      <CollapsibleTrigger class="w-full">
        {@render sectionHeader('Urgent', urgent.length, urgentOpen, 'border-l-destructive')}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div class="pl-6">
          <IssueList issues={urgent} {onIssueClick} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  {/if}

  {#if ready.length > 0}
    <Collapsible bind:open={readyOpen}>
      <CollapsibleTrigger class="w-full">
        {@render sectionHeader('Ready', ready.length, readyOpen, 'border-l-status-done')}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div class="pl-6">
          <IssueList issues={ready} {onIssueClick} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  {/if}

  {#if inProgress.length > 0}
    <Collapsible bind:open={inProgressOpen}>
      <CollapsibleTrigger class="w-full">
        {@render sectionHeader(
          'In Progress',
          inProgress.length,
          inProgressOpen,
          'border-l-status-doing',
        )}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div class="pl-6">
          <IssueList issues={inProgress} {onIssueClick} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  {/if}

  {#if blocked.length > 0}
    <Collapsible bind:open={blockedOpen}>
      <CollapsibleTrigger class="w-full">
        {@render sectionHeader('Blocked', blocked.length, blockedOpen, 'border-l-status-blocked')}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div class="pl-6">
          <IssueList issues={blocked} {onIssueClick} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  {/if}
</div>
