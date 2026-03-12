<script lang="ts">
  /**
   * TitleCell Component - Title with Chevron and Indentation
   *
   * Displays:
   * - Indentation based on hierarchy level
   * - Chevron icon (expand/collapse) if node has children
   * - Title text (read-only; editing via context menu or detail sheet)
   */

  import type { TreeNode } from '$lib/types/tree-grid';
  import type { Project, Epic, Issue } from '$lib/types';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import TreeLine from './TreeLine.svelte';
  import DependencyChip from '$lib/components/DependencyChip.svelte';
  import PriorityBadge from '$lib/components/PriorityBadge.svelte';
  import Badge from '$lib/components/ui/badge/badge.svelte';
  import StoryPointsBadge from '$lib/components/StoryPointsBadge.svelte';
  import { isLastChild } from '$lib/utils/tree-grid-helpers';
  import { getProjectColor } from '$lib/utils/project-colors';
  import { getProjectIcon } from '$lib/utils/project-icons';

  interface Props {
    node: TreeNode;
    allNodes: TreeNode[];
    isExpanded: boolean;
    indentation: string;
    fontWeight: string;
    isEditing?: boolean;
    onToggleExpand: () => void;
    onEdit: (value: string) => void;
    onStopEdit: () => void;
  }

  let {
    node,
    allNodes,
    isExpanded,
    indentation,
    fontWeight,
    isEditing = false,
    onToggleExpand,
    onEdit,
    onStopEdit,
  }: Props = $props();

  // Auto-focus action for the edit input
  function focusAndSelect(el: HTMLInputElement) {
    el.focus();
    el.select();
  }

  function handleEditKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      const value = (e.currentTarget as HTMLInputElement).value.trim();
      if (value) onEdit(value);
      onStopEdit();
    } else if (e.key === 'Escape') {
      onStopEdit();
    }
  }

  function handleEditBlur(e: FocusEvent) {
    const value = (e.currentTarget as HTMLInputElement).value.trim();
    if (value) onEdit(value);
    onStopEdit();
  }

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

  // Check if node is an issue type for dependency chip
  const isIssueNode = $derived(node.type === 'issue');
  const isEpicNode = $derived(node.type === 'epic');

  // Issue pills
  const issueData = $derived(isIssueNode ? (node.data as Issue) : null);
  const issuePriority = $derived(issueData?.priority ?? null);
  const issueSp = $derived(issueData?.story_points ?? null);
  const issueMilestone = $derived(issueData?.milestone ?? null);

  // Epic pills
  const epicData = $derived(isEpicNode ? (node.data as Epic) : null);
  const epicPriority = $derived(epicData?.priority ?? null);
  const epicMilestone = $derived(epicData?.milestone ?? null);

  // Project icon/color badge
  const isProjectNode = $derived(node.type === 'project');
  const projectColor = $derived(
    isProjectNode ? getProjectColor((node.data as Project).color) : null,
  );
  const ProjectIcon = $derived(isProjectNode ? getProjectIcon((node.data as Project).icon) : null);

  // Compute if this node is the last child
  const nodeIsLastChild = $derived(isLastChild(node, allNodes));
</script>

<div class="relative flex items-start gap-2" style="padding-left: {indentation}">
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
      class="flex items-center justify-center w-7 h-7 mt-0.5 cursor-pointer hover:bg-surface-subtle rounded transition-colors shrink-0"
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
    <div class="w-7 shrink-0 mt-0.5"></div>
  {/if}

  <!-- Project color+icon badge -->
  {#if isProjectNode && projectColor && ProjectIcon}
    <div class="h-6 w-6 rounded-md flex items-center justify-center shrink-0 {projectColor.bg}">
      {#key (node.data as Project).icon}
        <ProjectIcon size={13} class="text-white" />
      {/key}
    </div>
  {/if}

  <!-- Title (read-only or inline edit) -->
  {#if isEditing}
    <input
      use:focusAndSelect
      class="text-issue-title {fontWeight} flex-1 bg-transparent border-b border-primary outline-none min-w-0"
      value={title}
      onkeydown={handleEditKeydown}
      onblur={handleEditBlur}
    />
  {:else}
    <span class="text-issue-title {fontWeight} flex-1 min-w-0 wrap-break-word">
      <span class="text-muted-foreground font-mono text-xs">{prefix}-{number}</span>
      <span class="mx-1 text-muted-foreground">·</span>
      {title}
    </span>
  {/if}
  {#if isEpicNode && (epicPriority !== null || epicMilestone)}
    <span class="flex items-center gap-1 shrink-0 flex-wrap">
      {#if epicPriority !== null}
        <PriorityBadge priority={epicPriority} />
      {/if}
      {#if epicMilestone}
        <Badge variant="outline" class="text-xs max-w-25 truncate">{epicMilestone.name}</Badge>
      {/if}
    </span>
  {/if}
  {#if isIssueNode}
    <span class="flex items-center gap-1 shrink-0 flex-wrap">
      {#if issuePriority !== null}
        <PriorityBadge priority={issuePriority} />
      {/if}
      {#if issueSp !== null}
        <StoryPointsBadge story_points={issueSp} />
      {/if}
      {#if issueMilestone}
        <Badge variant="outline" class="text-xs max-w-25 truncate">{issueMilestone.name}</Badge>
      {/if}
    </span>
    <DependencyChip issue={node.data as Issue} />
  {/if}
</div>
