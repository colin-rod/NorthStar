<script lang="ts">
  /**
   * TitleCell Component - Title with Chevron and Indentation
   *
   * Displays:
   * - Indentation based on hierarchy level
   * - Chevron icon (expand/collapse) if node has children
   * - Optional drag handle (in edit mode)
   * - Title text (editable in edit mode)
   */

  import type { TreeNode } from '$lib/types/tree-grid';
  import type { Project, Epic, Issue } from '$lib/types';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import TreeLine from './TreeLine.svelte';
  import { isLastChild } from '$lib/utils/tree-grid-helpers';

  interface Props {
    node: TreeNode;
    allNodes: TreeNode[];
    isExpanded: boolean;
    indentation: string;
    fontWeight: string;
    editMode: boolean;
    onToggleExpand: () => void;
    onEdit: (value: string) => void;
  }

  let {
    node,
    allNodes,
    isExpanded,
    indentation,
    fontWeight,
    editMode,
    onToggleExpand,
    onEdit,
  }: Props = $props();

  // Get title based on node type
  const title = $derived.by(() => {
    if (node.type === 'project') {
      return (node.data as Project).name;
    } else if (node.type === 'epic') {
      return (node.data as Epic).name;
    } else {
      return (node.data as Issue).title;
    }
  });

  // Get number based on node type
  const number = $derived.by(() => {
    if (node.type === 'project') {
      return (node.data as Project).number;
    } else if (node.type === 'epic') {
      return (node.data as Epic).number;
    } else {
      return (node.data as Issue).number;
    }
  });

  // Get prefix based on node type
  const prefix = $derived.by(() => {
    if (node.type === 'project') {
      return 'P';
    } else if (node.type === 'epic') {
      return 'E';
    } else {
      return 'I';
    }
  });

  // Compute if this node is the last child
  const nodeIsLastChild = $derived(isLastChild(node, allNodes));

  let isEditing = $state(false);
  let editValue = $state(title);

  // Sync editValue when title changes (if not editing)
  $effect(() => {
    if (!isEditing) {
      editValue = title;
    }
  });

  function startEditing() {
    if (!editMode) return;
    isEditing = true;
    editValue = title;
  }

  function saveEdit() {
    if (editValue.trim() && editValue !== title) {
      onEdit(editValue.trim());
    }
    isEditing = false;
  }

  function cancelEdit() {
    editValue = title;
    isEditing = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  }
</script>

<div class="relative flex items-center gap-2" style="padding-left: {indentation}">
  <!-- Tree Lines (absolutely positioned within this cell) -->
  <div class="absolute inset-0 pointer-events-none">
    <TreeLine {node} isLastChild={nodeIsLastChild} {allNodes} />
  </div>

  <!-- Chevron (only if node has children) -->
  {#if node.hasChildren}
    <button
      onclick={(e) => {
        e.stopPropagation();
        onToggleExpand();
      }}
      class="flex items-center justify-center w-7 h-7 cursor-pointer hover:bg-surface-subtle rounded transition-colors flex-shrink-0"
      aria-label={isExpanded ? 'Collapse' : 'Expand'}
      aria-expanded={isExpanded}
    >
      {#if isExpanded}
        <ChevronDown class="h-4 w-4 text-muted-foreground" />
      {:else}
        <ChevronRight class="h-4 w-4 text-muted-foreground" />
      {/if}
    </button>
  {:else}
    <!-- Spacer to align titles when no chevron -->
    <div class="w-7 flex-shrink-0"></div>
  {/if}

  <!-- Title -->
  {#if isEditing}
    <input
      type="text"
      bind:value={editValue}
      onkeydown={handleKeydown}
      onblur={saveEdit}
      class="flex-1 px-2 py-1 text-sm border border-accent rounded focus:outline-none focus:ring-1 focus:ring-accent {fontWeight}"
      autofocus
    />
  {:else}
    <span
      class="text-issue-title {fontWeight} truncate flex-1 {editMode ? 'cursor-text' : ''}"
      onclick={startEditing}
      role={editMode ? 'button' : undefined}
      tabindex={editMode ? 0 : undefined}
    >
      <span class="text-muted-foreground font-mono text-sm">{prefix}-{number}</span>
      <span class="mx-1 text-muted-foreground">·</span>
      {title}
    </span>
  {/if}
</div>
