<script lang="ts">
  /**
   * ContextMenu — App-level right-click context menu for TreeGrid rows.
   *
   * Renders context-sensitive actions based on node type:
   * - project: Status, | Add Epic | Rename, Archive, Delete
   * - epic: Status, Priority, Milestone, | Add Issue | Rename, Delete
   * - issue: Status, Priority, Story Points, Milestone, | Delete
   *
   * Note: "Add Sub-issue" is intentionally excluded — sub-issues are not supported.
   */

  import * as CM from '$lib/components/ui/context-menu';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import Check from '@lucide/svelte/icons/check';
  import type { TreeNode } from '$lib/types/tree-grid';

  import type { Milestone, Project, Epic } from '$lib/types';

  interface Props {
    node: TreeNode | null;
    x: number;
    y: number;
    open: boolean;
    onClose: () => void;
    onRename?: (node: TreeNode) => void;
    onStatusChange?: (node: TreeNode, status: string) => void;
    onAddChild?: (node: TreeNode) => void;
    onArchive?: (node: TreeNode) => void;
    onDelete?: (node: TreeNode) => void;
    onPriorityChange?: (node: TreeNode, priority: number) => void;
    onStoryPointsChange?: (node: TreeNode, points: number) => void;
    milestones?: Milestone[];
    onMilestoneChange?: (node: TreeNode, milestoneId: string | null) => void;
    projects?: Pick<Project, 'id' | 'name'>[];
    allEpics?: Pick<Epic, 'id' | 'name' | 'project_id' | 'is_default'>[];
    onMoveToProject?: (node: TreeNode, projectId: string) => void;
    onMoveToEpic?: (node: TreeNode, epicId: string) => void;
  }

  let {
    node,
    x,
    y,
    open = $bindable(false),
    onClose,
    onRename,
    onStatusChange,
    onAddChild,
    onArchive,
    onDelete,
    onPriorityChange,
    onStoryPointsChange,
    milestones = [],
    onMilestoneChange,
    projects = [],
    allEpics = [],
    onMoveToProject,
    onMoveToEpic,
  }: Props = $props();

  let triggerRef: HTMLElement | null = $state(null);
  let deleteDialogOpen = $state(false);
  let nodeToDelete = $state<TreeNode | null>(null);

  // bits-ui positions the menu content based on the clientX/Y from the contextmenu
  // browser event fired on the trigger — not from the trigger's DOM position.
  // Dispatch a synthetic event so bits-ui captures the correct cursor coordinates.
  $effect(() => {
    if (open && triggerRef) {
      triggerRef.dispatchEvent(
        new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: x, clientY: y }),
      );
    }
  });

  const isProject = $derived(node?.type === 'project');
  const isEpic = $derived(node?.type === 'epic');
  const isIssue = $derived(node?.type === 'issue');

  const projectStatuses = [
    { value: 'backlog', label: 'Backlog' },
    { value: 'planned', label: 'Planned' },
    { value: 'active', label: 'Active' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'completed', label: 'Completed' },
    { value: 'canceled', label: 'Canceled' },
  ];

  const epicStatuses = [
    { value: 'backlog', label: 'Backlog' },
    { value: 'active', label: 'Active' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'completed', label: 'Completed' },
    { value: 'canceled', label: 'Canceled' },
  ];

  const issueStatuses = [
    { value: 'backlog', label: 'Backlog' },
    { value: 'todo', label: 'Todo' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'in_review', label: 'In Review' },
    { value: 'done', label: 'Done' },
    { value: 'canceled', label: 'Canceled' },
  ];

  const priorities = [
    { value: 0, label: 'P0 — Urgent' },
    { value: 1, label: 'P1 — High' },
    { value: 2, label: 'P2 — Medium' },
    { value: 3, label: 'P3 — Low' },
  ];

  const storyPoints = [1, 2, 3, 5, 8, 13, 21];

  // Current values for active highlighting
  const currentStatus = $derived((node?.data as any)?.status ?? null);
  const currentPriority = $derived((node?.data as any)?.priority ?? null);
  const currentStoryPoints = $derived((node?.data as any)?.story_points ?? null);
  const currentMilestoneId = $derived((node?.data as any)?.milestone_id ?? null);
  const currentProjectId = $derived((node?.data as any)?.project_id ?? null);
  const currentEpicId = $derived((node?.data as any)?.epic_id ?? null);
  const isDefaultEpic = $derived((node?.data as any)?.is_default ?? false);

  // Group epics by project for the "Move to Epic" submenu
  const epicsByProject = $derived.by(() => {
    const grouped = new Map<
      string,
      {
        project: Pick<Project, 'id' | 'name'>;
        epics: Pick<Epic, 'id' | 'name' | 'project_id' | 'is_default'>[];
      }
    >();
    for (const project of projects) {
      const projectEpics = allEpics.filter((e) => e.project_id === project.id);
      if (projectEpics.length > 0) {
        grouped.set(project.id, { project, epics: projectEpics });
      }
    }
    return grouped;
  });

  function handleDelete() {
    deleteDialogOpen = false;
    if (nodeToDelete) onDelete?.(nodeToDelete);
    nodeToDelete = null;
    onClose();
  }
</script>

{#if node}
  <!-- Invisible 1×1 trigger positioned at cursor for bits-ui to anchor the menu -->
  <CM.ContextMenu
    bind:open
    onOpenChange={(o) => {
      if (!o) onClose();
    }}
  >
    <CM.ContextMenuTrigger
      bind:ref={triggerRef}
      style="position: fixed; left: {x}px; top: {y}px; width: 1px; height: 1px; pointer-events: none; z-index: -1;"
      aria-hidden="true"
    />

    <CM.ContextMenuContent>
      <!-- ===== PROJECT ===== -->
      {#if isProject}
        <CM.ContextMenuSub>
          <CM.ContextMenuSubTrigger>Status</CM.ContextMenuSubTrigger>
          <CM.ContextMenuSubContent align="start">
            {#each projectStatuses as s}
              <CM.ContextMenuItem
                onclick={() => {
                  onStatusChange?.(node!, s.value);
                  onClose();
                }}
              >
                <span class="flex items-center gap-2">
                  {#if currentStatus === s.value}
                    <Check class="h-3 w-3 shrink-0" />
                  {:else}
                    <span class="w-3 shrink-0"></span>
                  {/if}
                  {s.label}
                </span>
              </CM.ContextMenuItem>
            {/each}
          </CM.ContextMenuSubContent>
        </CM.ContextMenuSub>

        <CM.ContextMenuSeparator />

        <CM.ContextMenuItem
          onclick={() => {
            onAddChild?.(node!);
            onClose();
          }}
        >
          Add Epic
        </CM.ContextMenuItem>

        <CM.ContextMenuSeparator />

        <CM.ContextMenuItem
          onclick={() => {
            onRename?.(node!);
            onClose();
          }}
        >
          Rename
        </CM.ContextMenuItem>

        <CM.ContextMenuItem
          onclick={() => {
            onArchive?.(node!);
            onClose();
          }}
        >
          Archive
        </CM.ContextMenuItem>

        <CM.ContextMenuItem
          class="text-destructive focus:text-destructive"
          onclick={() => {
            nodeToDelete = node;
            deleteDialogOpen = true;
          }}
        >
          Delete
        </CM.ContextMenuItem>
      {/if}

      <!-- ===== EPIC ===== -->
      {#if isEpic}
        <CM.ContextMenuSub>
          <CM.ContextMenuSubTrigger>Status</CM.ContextMenuSubTrigger>
          <CM.ContextMenuSubContent align="start">
            {#each epicStatuses as s}
              <CM.ContextMenuItem
                onclick={() => {
                  onStatusChange?.(node!, s.value);
                  onClose();
                }}
              >
                <span class="flex items-center gap-2">
                  {#if currentStatus === s.value}
                    <Check class="h-3 w-3 shrink-0" />
                  {:else}
                    <span class="w-3 shrink-0"></span>
                  {/if}
                  {s.label}
                </span>
              </CM.ContextMenuItem>
            {/each}
          </CM.ContextMenuSubContent>
        </CM.ContextMenuSub>

        <CM.ContextMenuSub>
          <CM.ContextMenuSubTrigger>Priority</CM.ContextMenuSubTrigger>
          <CM.ContextMenuSubContent align="start">
            {#each priorities as p}
              <CM.ContextMenuItem
                onclick={() => {
                  onPriorityChange?.(node!, p.value);
                  onClose();
                }}
              >
                <span class="flex items-center gap-2">
                  {#if currentPriority === p.value}
                    <Check class="h-3 w-3 shrink-0" />
                  {:else}
                    <span class="w-3 shrink-0"></span>
                  {/if}
                  {p.label}
                </span>
              </CM.ContextMenuItem>
            {/each}
          </CM.ContextMenuSubContent>
        </CM.ContextMenuSub>

        <CM.ContextMenuSub>
          <CM.ContextMenuSubTrigger>Milestone</CM.ContextMenuSubTrigger>
          <CM.ContextMenuSubContent align="start">
            <CM.ContextMenuItem
              onclick={() => {
                onMilestoneChange?.(node!, null);
                onClose();
              }}
            >
              <span class="flex items-center gap-2">
                {#if currentMilestoneId === null}
                  <Check class="h-3 w-3 shrink-0" />
                {:else}
                  <span class="w-3 shrink-0"></span>
                {/if}
                No Milestone
              </span>
            </CM.ContextMenuItem>
            {#each milestones as m}
              <CM.ContextMenuItem
                onclick={() => {
                  onMilestoneChange?.(node!, m.id);
                  onClose();
                }}
              >
                <span class="flex items-center gap-2">
                  {#if currentMilestoneId === m.id}
                    <Check class="h-3 w-3 shrink-0" />
                  {:else}
                    <span class="w-3 shrink-0"></span>
                  {/if}
                  {m.name}
                </span>
              </CM.ContextMenuItem>
            {/each}
          </CM.ContextMenuSubContent>
        </CM.ContextMenuSub>

        {#if !isDefaultEpic && projects.length > 1}
          <CM.ContextMenuSub>
            <CM.ContextMenuSubTrigger>Move to Project</CM.ContextMenuSubTrigger>
            <CM.ContextMenuSubContent align="start">
              {#each projects as project (project.id)}
                <CM.ContextMenuItem
                  disabled={currentProjectId === project.id}
                  onclick={() => {
                    onMoveToProject?.(node!, project.id);
                    onClose();
                  }}
                >
                  <span class="flex items-center gap-2">
                    {#if currentProjectId === project.id}
                      <Check class="h-3 w-3 shrink-0" />
                    {:else}
                      <span class="w-3 shrink-0"></span>
                    {/if}
                    {project.name}
                  </span>
                </CM.ContextMenuItem>
              {/each}
            </CM.ContextMenuSubContent>
          </CM.ContextMenuSub>
        {/if}

        <CM.ContextMenuSeparator />

        <CM.ContextMenuItem
          onclick={() => {
            onAddChild?.(node!);
            onClose();
          }}
        >
          Add Issue
        </CM.ContextMenuItem>

        <CM.ContextMenuSeparator />

        <CM.ContextMenuItem
          onclick={() => {
            onRename?.(node!);
            onClose();
          }}
        >
          Rename
        </CM.ContextMenuItem>

        <CM.ContextMenuItem
          class="text-destructive focus:text-destructive"
          onclick={() => {
            nodeToDelete = node;
            deleteDialogOpen = true;
          }}
        >
          Delete
        </CM.ContextMenuItem>
      {/if}

      <!-- ===== ISSUE / SUB-ISSUE ===== -->
      {#if isIssue}
        <CM.ContextMenuSub>
          <CM.ContextMenuSubTrigger>Status</CM.ContextMenuSubTrigger>
          <CM.ContextMenuSubContent align="start">
            {#each issueStatuses as s}
              <CM.ContextMenuItem
                onclick={() => {
                  onStatusChange?.(node!, s.value);
                  onClose();
                }}
              >
                <span class="flex items-center gap-2">
                  {#if currentStatus === s.value}
                    <Check class="h-3 w-3 shrink-0" />
                  {:else}
                    <span class="w-3 shrink-0"></span>
                  {/if}
                  {s.label}
                </span>
              </CM.ContextMenuItem>
            {/each}
          </CM.ContextMenuSubContent>
        </CM.ContextMenuSub>

        <CM.ContextMenuSub>
          <CM.ContextMenuSubTrigger>Priority</CM.ContextMenuSubTrigger>
          <CM.ContextMenuSubContent align="start">
            {#each priorities as p}
              <CM.ContextMenuItem
                onclick={() => {
                  onPriorityChange?.(node!, p.value);
                  onClose();
                }}
              >
                <span class="flex items-center gap-2">
                  {#if currentPriority === p.value}
                    <Check class="h-3 w-3 shrink-0" />
                  {:else}
                    <span class="w-3 shrink-0"></span>
                  {/if}
                  {p.label}
                </span>
              </CM.ContextMenuItem>
            {/each}
          </CM.ContextMenuSubContent>
        </CM.ContextMenuSub>

        <CM.ContextMenuSub>
          <CM.ContextMenuSubTrigger>Story Points</CM.ContextMenuSubTrigger>
          <CM.ContextMenuSubContent align="start">
            {#each storyPoints as sp}
              <CM.ContextMenuItem
                onclick={() => {
                  onStoryPointsChange?.(node!, sp);
                  onClose();
                }}
              >
                <span class="flex items-center gap-2">
                  {#if currentStoryPoints === sp}
                    <Check class="h-3 w-3 shrink-0" />
                  {:else}
                    <span class="w-3 shrink-0"></span>
                  {/if}
                  {sp}
                </span>
              </CM.ContextMenuItem>
            {/each}
          </CM.ContextMenuSubContent>
        </CM.ContextMenuSub>

        <CM.ContextMenuSub>
          <CM.ContextMenuSubTrigger>Milestone</CM.ContextMenuSubTrigger>
          <CM.ContextMenuSubContent align="start">
            <CM.ContextMenuItem
              onclick={() => {
                onMilestoneChange?.(node!, null);
                onClose();
              }}
            >
              <span class="flex items-center gap-2">
                {#if currentMilestoneId === null}
                  <Check class="h-3 w-3 shrink-0" />
                {:else}
                  <span class="w-3 shrink-0"></span>
                {/if}
                No Milestone
              </span>
            </CM.ContextMenuItem>
            {#each milestones as m}
              <CM.ContextMenuItem
                onclick={() => {
                  onMilestoneChange?.(node!, m.id);
                  onClose();
                }}
              >
                <span class="flex items-center gap-2">
                  {#if currentMilestoneId === m.id}
                    <Check class="h-3 w-3 shrink-0" />
                  {:else}
                    <span class="w-3 shrink-0"></span>
                  {/if}
                  {m.name}
                </span>
              </CM.ContextMenuItem>
            {/each}
          </CM.ContextMenuSubContent>
        </CM.ContextMenuSub>

        {#if allEpics.length > 1}
          <CM.ContextMenuSub>
            <CM.ContextMenuSubTrigger>Move to Epic</CM.ContextMenuSubTrigger>
            <CM.ContextMenuSubContent align="start">
              {#each [...epicsByProject.values()] as { project, epics } (project.id)}
                <CM.ContextMenuSub>
                  <CM.ContextMenuSubTrigger>{project.name}</CM.ContextMenuSubTrigger>
                  <CM.ContextMenuSubContent align="start">
                    {#each epics as epic (epic.id)}
                      <CM.ContextMenuItem
                        disabled={currentEpicId === epic.id}
                        onclick={() => {
                          onMoveToEpic?.(node!, epic.id);
                          onClose();
                        }}
                      >
                        <span class="flex items-center gap-2">
                          {#if currentEpicId === epic.id}
                            <Check class="h-3 w-3 shrink-0" />
                          {:else}
                            <span class="w-3 shrink-0"></span>
                          {/if}
                          {epic.name}
                        </span>
                      </CM.ContextMenuItem>
                    {/each}
                  </CM.ContextMenuSubContent>
                </CM.ContextMenuSub>
              {/each}
            </CM.ContextMenuSubContent>
          </CM.ContextMenuSub>
        {/if}

        <CM.ContextMenuSeparator />

        <CM.ContextMenuItem
          class="text-destructive focus:text-destructive"
          onclick={() => {
            nodeToDelete = node;
            deleteDialogOpen = true;
          }}
        >
          Delete
        </CM.ContextMenuItem>
      {/if}
    </CM.ContextMenuContent>
  </CM.ContextMenu>
{/if}

<!-- Delete confirmation dialog — separate from context menu to avoid nesting issues -->
<Dialog.Root bind:open={deleteDialogOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Are you sure?</Dialog.Title>
      <Dialog.Description>
        This will permanently delete the {nodeToDelete?.type ?? node?.type}. This action cannot be
        undone.
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (deleteDialogOpen = false)}>Cancel</Button>
      <Button variant="destructive" onclick={handleDelete}>Confirm</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
