<script lang="ts">
  import * as Command from '$lib/components/ui/command';
  import IssueSheet from '$lib/components/IssueSheet.svelte';
  import PriorityBadge from '$lib/components/PriorityBadge.svelte';
  import { Search } from '@lucide/svelte';
  import {
    openIssueSheet,
    selectedIssue,
    isIssueSheetOpen,
    navSearchOpen,
  } from '$lib/stores/issues';
  import { getStatusDotClass, formatStatus } from '$lib/utils/design-tokens';
  import type { Issue, Epic, Milestone } from '$lib/types';

  let open = $state(false);
  let query = $state('');
  let loading = $state(false);
  let displayedIssues = $state<Issue[]>([]);
  let epics = $state<Epic[]>([]);
  let milestones = $state<Milestone[]>([]);
  let epicsLoaded = false;

  let abortController: AbortController | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  // Keep local open state in sync with the store (BottomNav sets the store directly)
  $effect(() => {
    if ($navSearchOpen && !open) {
      openSearch();
    }
  });

  // Debounce query changes and fetch from server
  $effect(() => {
    const q = query;
    if (!open) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      fetchResults(q);
    }, 300);
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  });

  async function fetchResults(q: string) {
    abortController?.abort();
    const controller = new AbortController();
    abortController = controller;
    loading = true;
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
      });
      if (res.ok) {
        const data = await res.json();
        displayedIssues = data.issues ?? [];
        if (!epicsLoaded) {
          epics = data.epics ?? [];
          milestones = data.milestones ?? [];
          epicsLoaded = true;
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') console.error('Search error:', err);
    } finally {
      if (abortController === controller) loading = false;
    }
  }

  function openSearch() {
    open = true;
    navSearchOpen.set(true);
    fetchResults('');
  }

  function closeSearch() {
    open = false;
    navSearchOpen.set(false);
    query = '';
    epicsLoaded = false;
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    abortController?.abort();
    abortController = null;
  }

  function handleGlobalKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      e.preventDefault();
      openSearch();
    }
  }

  function handleSelect(issue: Issue) {
    openIssueSheet(issue);
    closeSearch();
  }
</script>

<svelte:window onkeydown={handleGlobalKeydown} />

<!-- Search trigger button -->
<button
  onclick={openSearch}
  aria-label="Search (⌘K)"
  class="inline-flex items-center gap-2 text-foreground-muted hover:text-foreground transition-colors"
>
  <Search class="w-5 h-5" />
  <span class="text-body hidden sm:inline">Search</span>
  <kbd
    class="hidden sm:inline-flex items-center gap-0.5 rounded border border-border-divider px-1.5 py-0.5 text-xs text-foreground-muted font-sans"
    aria-hidden="true">⌘K</kbd
  >
</button>

<!-- Command palette modal -->
<Command.Dialog
  bind:open
  title="Search"
  description="Search issues, projects, and epics"
  onOpenChange={(v) => {
    if (!v) closeSearch();
  }}
>
  <Command.Input bind:value={query} placeholder="Search issues, projects, epics..." />
  <Command.List>
    {#if loading}
      <Command.Loading>Loading…</Command.Loading>
    {:else}
      <Command.Empty>No issues found</Command.Empty>
      <Command.Group
        heading={query.trim()
          ? `${displayedIssues.length} result${displayedIssues.length === 1 ? '' : 's'}`
          : 'Recent issues'}
      >
        {#each displayedIssues as issue (issue.id)}
          <Command.Item
            value={issue.id}
            onSelect={() => handleSelect(issue)}
            class="flex items-center gap-3 py-2"
          >
            <!-- Status dot -->
            <div
              class="w-2 h-2 rounded-full shrink-0 {getStatusDotClass(issue.status)}"
              aria-hidden="true"
            ></div>

            <!-- Priority -->
            <PriorityBadge priority={issue.priority} />

            <!-- Title + metadata -->
            <div class="flex-1 min-w-0">
              <span class="truncate block text-sm">{issue.title}</span>
              <span class="truncate block text-xs text-muted-foreground">
                {issue.project?.name} / {issue.epic?.name}
              </span>
            </div>

            <!-- Status label -->
            <span class="text-xs text-muted-foreground shrink-0 hidden sm:block">
              {formatStatus(issue.status)}
            </span>
          </Command.Item>
        {/each}
      </Command.Group>
    {/if}
  </Command.List>
</Command.Dialog>

<!-- IssueSheet for editing from search results -->
<IssueSheet
  bind:open={$isIssueSheetOpen}
  bind:issue={$selectedIssue}
  {epics}
  {milestones}
  projectIssues={displayedIssues}
/>
