<script lang="ts">
  /**
   * ProjectCard Component - North Design System
   *
   * Displays a project card with epic counts and action buttons.
   * Used in: Projects list view
   *
   * North Design Principles:
   * - 10px border radius for cards
   * - Subtle border, no heavy shadows
   * - Minimal hover states
   * - Clean typography hierarchy
   *
   * Requirements from CLAUDE.md:
   * - Show project name
   * - Show epic counts (Ready, Blocked, Doing)
   * - Clickable to navigate to project detail
   * - Edit and archive actions
   */

  import { enhance } from '$app/forms';
  import type { Project } from '$lib/types';
  import { Card, CardHeader, CardContent } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import { Pencil, Archive } from '@lucide/svelte';

  interface Props {
    project: Project;
    onEdit?: (project: Project) => void;
    onArchive?: (project: Project) => void;
  }

  let { project, onEdit, onArchive }: Props = $props();

  // TODO: Calculate counts from project.epics
  const readyCount = 0;
  const blockedCount = 0;
  const doingCount = 0;

  function handleEdit(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onEdit?.(project);
  }

  function handleArchiveClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Archive "${project.name}"? It will be hidden from this list.`)) {
      // Submit the form
      const form = (e.target as HTMLElement).closest('form');
      if (form) {
        form.requestSubmit();
      }
    }
  }
</script>

<!-- North Design: Card with 10px radius, subtle border, minimal hover -->
<div class="relative group">
  <a href="/projects/{project.id}" class="block">
    <Card
      class="hover:shadow-level-1 transition-shadow duration-150 cursor-pointer border rounded-md"
    >
      <CardHeader class="pb-4">
        <div class="flex items-center justify-between">
          <!-- Project name: section header weight -->
          <h3 class="text-section-header font-ui">{project.name}</h3>

          <!-- Action buttons - visible on hover -->
          <div
            class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onclick={(e) => e.preventDefault()}
          >
            {#if onEdit}
              <Button
                variant="ghost"
                size="icon"
                class="h-8 w-8"
                onclick={handleEdit}
                aria-label="Edit project"
              >
                <Pencil class="h-4 w-4" />
              </Button>
            {/if}
            {#if onArchive}
              <form method="POST" action="?/archiveProject" use:enhance class="inline">
                <input type="hidden" name="id" value={project.id} />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8 text-foreground-muted hover:text-destructive"
                  onclick={handleArchiveClick}
                  aria-label="Archive project"
                >
                  <Archive class="h-4 w-4" />
                </Button>
              </form>
            {/if}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <!-- Counts with subtle badges -->
        <div class="flex gap-4 text-metadata">
          <div class="flex items-center gap-2">
            <Badge variant="default" class="text-xs">{readyCount}</Badge>
            <span class="text-foreground-secondary">Ready</span>
          </div>
          <div class="flex items-center gap-2">
            <Badge variant="status-doing" class="text-xs">{doingCount}</Badge>
            <span class="text-foreground-secondary">Doing</span>
          </div>
          <div class="flex items-center gap-2">
            <Badge variant="status-blocked" class="text-xs">{blockedCount}</Badge>
            <span class="text-foreground-secondary">Blocked</span>
          </div>
        </div>
      </CardContent>
    </Card>
  </a>
</div>

<!-- TODO: Implement count calculations from loaded data -->
<!-- TODO: Add loading skeleton state -->
