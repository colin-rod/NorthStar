<script lang="ts">
  /**
   * TreeLine Component - GitHub-style Tree Connectors
   *
   * Renders vertical and horizontal connector lines to visualize tree hierarchy.
   * Lines connect parent nodes to their children similar to GitHub's file tree.
   */

  import type { TreeNode } from '$lib/types/tree-grid';
  import { isLastChild as checkIsLastChild } from '$lib/utils/tree-grid-helpers';

  interface Props {
    node: TreeNode;
    isLastChild: boolean;
    allNodes: TreeNode[];
  }

  let { node, isLastChild, allNodes }: Props = $props();

  // Compute which ancestor levels need vertical lines
  // A level needs a line if there's a sibling below this node at that level
  const ancestorLines = $derived.by(() => {
    const lines: boolean[] = [];

    // For each ancestor level (0 to node.level - 1)
    for (let level = 0; level < node.level; level++) {
      // Find the ancestor at this level
      let ancestorId = node.parentId;
      let currentLevel = node.level - 1;

      while (currentLevel > level && ancestorId) {
        const ancestor = allNodes.find((n) => n.id === ancestorId);
        ancestorId = ancestor?.parentId || null;
        currentLevel--;
      }

      if (ancestorId) {
        // Check if this ancestor is the last child at its level
        const ancestor = allNodes.find((n) => n.id === ancestorId);
        if (ancestor) {
          const ancestorIsLast = checkIsLastChild(ancestor, allNodes);
          lines[level] = !ancestorIsLast; // Draw line if NOT last child
        }
      }
    }

    return lines;
  });
</script>

<!-- Tree line container - absolutely positioned -->
<div class="absolute inset-0 pointer-events-none">
  <!-- Vertical lines for each ancestor level -->
  {#each ancestorLines as needsLine, level}
    {#if needsLine}
      <div
        class="absolute top-0 bottom-0 w-px bg-border-divider"
        style="left: {level * 16 + 20}px"
      ></div>
    {/if}
  {/each}

  <!-- Current level connectors -->
  {#if node.level > 0}
    <!-- Vertical line from top to middle (connects to parent above) -->
    <div
      class="absolute top-0 w-px bg-border-divider"
      style="left: {(node.level - 1) * 16 + 20}px; height: 50%"
    ></div>

    <!-- Vertical line from middle to bottom (only if NOT last child) -->
    {#if !isLastChild}
      <div
        class="absolute w-px bg-border-divider"
        style="left: {(node.level - 1) * 16 + 20}px; top: 50%; bottom: 0"
      ></div>
    {/if}

    <!-- Horizontal line to chevron -->
    <div
      class="absolute h-px bg-border-divider"
      style="top: 50%; left: {(node.level - 1) * 16 + 20}px; width: 12px"
    ></div>
  {/if}
</div>
