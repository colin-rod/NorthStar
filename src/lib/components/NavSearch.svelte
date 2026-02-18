<script lang="ts">
  import { Search, X } from '@lucide/svelte';
  import IssueRow from '$lib/components/IssueRow.svelte';
  import IssueSheet from '$lib/components/IssueSheet.svelte';
  import {
    openIssueSheet,
    selectedIssue,
    isIssueSheetOpen,
    navSearchOpen,
  } from '$lib/stores/issues';
  import type { Issue, Epic, Milestone } from '$lib/types';

  let open = $derived($navSearchOpen);
  let query = $state('');
  let loading = $state(false);
  let allIssues = $state<Issue[]>([]);
  let epics = $state<Epic[]>([]);
  let milestones = $state<Milestone[]>([]);
  let inputEl = $state<HTMLInputElement | null>(null);
  let containerEl = $state<HTMLDivElement | null>(null);

  let filteredIssues = $derived(
    query.trim()
      ? allIssues.filter((issue) => {
          const q = query.toLowerCase();
          return (
            issue.title.toLowerCase().includes(q) ||
            issue.project?.name?.toLowerCase().includes(q) ||
            issue.epic?.name?.toLowerCase().includes(q)
          );
        })
      : [],
  );

  async function openSearch() {
    navSearchOpen.set(true);
    // Fetch data once
    if (allIssues.length === 0 && !loading) {
      loading = true;
      try {
        const res = await fetch('/api/search');
        if (res.ok) {
          const data = await res.json();
          allIssues = data.issues ?? [];
          epics = data.epics ?? [];
          milestones = data.milestones ?? [];
        }
      } finally {
        loading = false;
      }
    }
    // Focus input after tick
    setTimeout(() => inputEl?.focus(), 50);
  }

  function closeSearch() {
    navSearchOpen.set(false);
    query = '';
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      closeSearch();
    }
  }

  function handleResultClick(issue: Issue) {
    openIssueSheet(issue);
    closeSearch();
  }

  function handleClickOutside(e: MouseEvent) {
    if (open && containerEl && !containerEl.contains(e.target as Node)) {
      closeSearch();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} onclick={handleClickOutside} />

<div bind:this={containerEl} class="relative">
  {#if !open}
    <!-- Collapsed: icon + label -->
    <button
      onclick={openSearch}
      aria-label="Search"
      class="inline-flex items-center gap-2 text-foreground-muted hover:text-foreground transition-colors"
    >
      <Search class="w-5 h-5" />
      <span class="text-body hidden sm:inline">Search</span>
    </button>
  {:else}
    <!-- Expanded: input field -->
    <div class="flex items-center gap-2">
      <Search class="w-4 h-4 text-foreground-muted shrink-0" />
      <input
        bind:this={inputEl}
        bind:value={query}
        type="search"
        placeholder="Search issues, projects, epics..."
        class="w-48 sm:w-64 bg-transparent border-b border-border-divider focus:border-primary outline-none text-body text-foreground placeholder:text-foreground-muted pb-0.5 transition-all"
        aria-label="Search issues"
        autocomplete="off"
      />
      <button
        onclick={closeSearch}
        aria-label="Close search"
        class="text-foreground-muted hover:text-foreground transition-colors"
      >
        <X class="w-4 h-4" />
      </button>
    </div>
  {/if}

  <!-- Dropdown results -->
  {#if open && query.trim().length > 0}
    <div
      class="absolute right-0 top-full mt-2 w-[480px] max-w-[90vw] bg-surface border border-border-divider rounded-lg shadow-lg z-50 overflow-hidden"
    >
      {#if loading}
        <div class="px-4 py-6 text-center text-foreground-muted text-body">Loading...</div>
      {:else if filteredIssues.length === 0}
        <div class="px-4 py-6 text-center text-foreground-muted text-body">
          No issues match your search
        </div>
      {:else}
        <div class="max-h-96 overflow-y-auto">
          <p class="px-4 py-2 text-metadata text-foreground-muted border-b border-border-divider">
            {filteredIssues.length}
            {filteredIssues.length === 1 ? 'issue' : 'issues'} found
          </p>
          {#each filteredIssues as issue (issue.id)}
            <IssueRow {issue} onClick={() => handleResultClick(issue)} dragDisabled={true} />
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<!-- IssueSheet for editing from search results -->
<IssueSheet
  bind:open={$isIssueSheetOpen}
  bind:issue={$selectedIssue}
  {epics}
  {milestones}
  projectIssues={allIssues}
/>
