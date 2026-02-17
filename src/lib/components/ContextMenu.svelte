<script lang="ts">
  /**
   * ContextMenu — App-level right-click context menu for TreeGrid rows.
   *
   * Renders context-sensitive actions based on node type:
   * - project: Rename, Status, Add Epic, Archive, Delete
   * - epic: Rename, Status, Add Issue, Delete
   * - issue: Status, Priority, Story Points, Add Sub-issue, Delete
   * - sub-issue: Status, Priority, Story Points, Delete
   */

  import * as CM from '$lib/components/ui/context-menu';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import type { TreeNode } from '$lib/types/tree-grid';

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
  }: Props = $props();

  let triggerRef: HTMLElement | null = $state(null);
  let deleteDialogOpen = $state(false);

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
  const isSubIssue = $derived(node?.type === 'sub-issue');
  const isIssueOrSub = $derived(isIssue || isSubIssue);

  const projectStatuses = [
    { value: 'active', label: 'Active' },
    { value: 'done', label: 'Done' },
    { value: 'canceled', label: 'Canceled' },
  ];

  const issueStatuses = [
    { value: 'todo', label: 'Todo' },
    { value: 'doing', label: 'In Progress' },
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

  function handleDelete() {
    deleteDialogOpen = false;
    if (node) onDelete?.(node);
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
        <CM.ContextMenuItem
          onclick={() => {
            onRename?.(node!);
            onClose();
          }}
        >
          Rename
        </CM.ContextMenuItem>

        <CM.ContextMenuSub>
          <CM.ContextMenuSubTrigger>Status</CM.ContextMenuSubTrigger>
          <CM.ContextMenuSubContent>
            {#each projectStatuses as s}
              <CM.ContextMenuItem
                onclick={() => {
                  onStatusChange?.(node!, s.value);
                  onClose();
                }}
              >
                {s.label}
              </CM.ContextMenuItem>
            {/each}
          </CM.ContextMenuSubContent>
        </CM.ContextMenuSub>

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
            onArchive?.(node!);
            onClose();
          }}
        >
          Archive
        </CM.ContextMenuItem>

        <CM.ContextMenuItem
          class="text-destructive focus:text-destructive"
          onclick={() => {
            deleteDialogOpen = true;
          }}
        >
          Delete
        </CM.ContextMenuItem>
      {/if}

      <!-- ===== EPIC ===== -->
      {#if isEpic}
        <CM.ContextMenuItem
          onclick={() => {
            onRename?.(node!);
            onClose();
          }}
        >
          Rename
        </CM.ContextMenuItem>

        <CM.ContextMenuSub>
          <CM.ContextMenuSubTrigger>Status</CM.ContextMenuSubTrigger>
          <CM.ContextMenuSubContent>
            {#each projectStatuses as s}
              <CM.ContextMenuItem
                onclick={() => {
                  onStatusChange?.(node!, s.value);
                  onClose();
                }}
              >
                {s.label}
              </CM.ContextMenuItem>
            {/each}
          </CM.ContextMenuSubContent>
        </CM.ContextMenuSub>

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
          class="text-destructive focus:text-destructive"
          onclick={() => {
            deleteDialogOpen = true;
          }}
        >
          Delete
        </CM.ContextMenuItem>
      {/if}

      <!-- ===== ISSUE or SUB-ISSUE ===== -->
      {#if isIssueOrSub}
        <CM.ContextMenuSub>
          <CM.ContextMenuSubTrigger>Status</CM.ContextMenuSubTrigger>
          <CM.ContextMenuSubContent>
            {#each issueStatuses as s}
              <CM.ContextMenuItem
                onclick={() => {
                  onStatusChange?.(node!, s.value);
                  onClose();
                }}
              >
                {s.label}
              </CM.ContextMenuItem>
            {/each}
          </CM.ContextMenuSubContent>
        </CM.ContextMenuSub>

        <CM.ContextMenuSub>
          <CM.ContextMenuSubTrigger>Priority</CM.ContextMenuSubTrigger>
          <CM.ContextMenuSubContent>
            {#each priorities as p}
              <CM.ContextMenuItem
                onclick={() => {
                  onPriorityChange?.(node!, p.value);
                  onClose();
                }}
              >
                {p.label}
              </CM.ContextMenuItem>
            {/each}
          </CM.ContextMenuSubContent>
        </CM.ContextMenuSub>

        <CM.ContextMenuSub>
          <CM.ContextMenuSubTrigger>Story Points</CM.ContextMenuSubTrigger>
          <CM.ContextMenuSubContent>
            {#each storyPoints as sp}
              <CM.ContextMenuItem
                onclick={() => {
                  onStoryPointsChange?.(node!, sp);
                  onClose();
                }}
              >
                {sp}
              </CM.ContextMenuItem>
            {/each}
          </CM.ContextMenuSubContent>
        </CM.ContextMenuSub>

        {#if isIssue}
          <CM.ContextMenuSeparator />
          <CM.ContextMenuItem
            onclick={() => {
              onAddChild?.(node!);
              onClose();
            }}
          >
            Add Sub-issue
          </CM.ContextMenuItem>
        {/if}

        <CM.ContextMenuSeparator />

        <CM.ContextMenuItem
          class="text-destructive focus:text-destructive"
          onclick={() => {
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
        This will permanently delete the {node?.type}. This action cannot be undone.
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (deleteDialogOpen = false)}>Cancel</Button>
      <Button variant="destructive" onclick={handleDelete}>Confirm</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
