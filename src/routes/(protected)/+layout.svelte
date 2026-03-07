<script lang="ts">
  /**
   * Protected Layout
   *
   * Wraps all authenticated pages.
   * Shows navigation, checks auth status.
   */

  import BottomNav from '$lib/components/BottomNav.svelte';
  import Header from '$lib/components/Header.svelte';
  import SideNav from '$lib/components/SideNav.svelte';
  import KeyboardShortcutsHelp from '$lib/components/KeyboardShortcutsHelp.svelte';
  import StoryPointsPicker from '$lib/components/StoryPointsPicker.svelte';
  import type { BreadcrumbItem } from '$lib/components/Breadcrumbs.svelte';
  import { Toaster } from '$lib/components/ui/sonner';
  import { navigating } from '$app/stores';
  import { deserialize } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { toast } from 'svelte-sonner';
  import { get } from 'svelte/store';
  import { focusedIssue, shortcutsHelpOpen, storyPointsPickerOpen } from '$lib/stores/keyboard';
  import { openCreateIssueSheet, openIssueSheet } from '$lib/stores/issues';
  import { cycleStatus } from '$lib/utils/issue-helpers';

  const { children, data } = $props();

  // Extract breadcrumbs from page data if available
  let breadcrumbs = $derived<BreadcrumbItem[]>((data as any).breadcrumbs || []);

  function isTyping(e: KeyboardEvent): boolean {
    const target = e.target as HTMLElement;
    const tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
  }

  async function saveIssueField(issueId: string, field: string, value: string) {
    const formData = new FormData();
    formData.append('id', issueId);
    formData.append(field, value);

    const response = await fetch('?/updateIssue', { method: 'POST', body: formData });
    const result = deserialize(await response.text());

    if (result.type === 'success') {
      await invalidateAll();
    } else {
      toast.error('Failed to update issue', { duration: 4000 });
    }
  }

  async function handleKeydown(e: KeyboardEvent) {
    // Skip if modifier keys are held (⌘K is handled by NavSearch)
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    // Skip if typing in a form field
    if (isTyping(e)) return;

    const issue = get(focusedIssue);

    switch (e.key) {
      case 'n':
        e.preventDefault();
        openCreateIssueSheet();
        break;

      case '?':
        e.preventDefault();
        shortcutsHelpOpen.update((v) => !v);
        break;

      case 'e':
        if (!issue) return;
        e.preventDefault();
        openIssueSheet(issue);
        break;

      case 'c':
        if (!issue) return;
        e.preventDefault();
        await saveIssueField(issue.id, 'status', cycleStatus(issue.status));
        break;

      case '1':
      case '2':
      case '3':
      case '4':
        if (!issue) return;
        e.preventDefault();
        await saveIssueField(issue.id, 'priority', String(parseInt(e.key) - 1));
        break;

      case 's':
        if (!issue) return;
        e.preventDefault();
        storyPointsPickerOpen.set(true);
        break;
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if $navigating}
  <div class="fixed top-0 left-0 right-0 h-0.5 bg-primary z-50 animate-pulse"></div>
{/if}

<div class="min-h-screen flex">
  <!-- Desktop: Left sidebar -->
  <SideNav />

  <!-- Main content area -->
  <div class="flex-1 flex flex-col pb-16 md:pb-0 md:ml-64">
    <Header session={data.session} {breadcrumbs} />
    <main class="flex-1 container mx-auto px-4 py-6 max-w-6xl">
      {@render children()}
    </main>
  </div>

  <!-- Mobile: Bottom navigation -->
  <BottomNav />
</div>

<!-- Toast notifications -->
<Toaster position="bottom-center" />

<!-- Keyboard shortcut modals -->
<KeyboardShortcutsHelp />
<StoryPointsPicker />
