<script lang="ts">
  /**
   * ProjectSheet Component - North Design System
   *
   * Bottom sheet for creating and editing projects.
   * Used in: Projects list view
   *
   * North Design Principles:
   * - Mobile-first bottom sheet
   * - Clean form layout with validation
   * - Warm orange primary actions
   * - 10px border radius
   *
   * Props:
   * - open: Controls sheet visibility (bindable)
   * - mode: 'create' | 'edit' - Determines form action and title
   * - project: Optional project data for edit mode
   */

  import { enhance } from '$app/forms';
  import type { Project } from '$lib/types';
  import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetFooter,
    SheetTitle,
  } from '$lib/components/ui/sheet';
  import Button from '$lib/components/ui/button.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import Label from '$lib/components/ui/label.svelte';

  interface Props {
    open: boolean;
    mode: 'create' | 'edit';
    project?: Project;
  }

  let { open = $bindable(false), mode, project }: Props = $props();

  const action = mode === 'create' ? '?/createProject' : '?/updateProject';
  const title = mode === 'create' ? 'New Project' : 'Edit Project';
  const submitLabel = mode === 'create' ? 'Create Project' : 'Save Changes';
</script>

<Sheet bind:open>
  <SheetContent side="bottom" class="h-[400px] sm:max-w-xl sm:mx-auto">
    <SheetHeader>
      <SheetTitle class="text-section-header">{title}</SheetTitle>
    </SheetHeader>

    <form
      method="POST"
      {action}
      use:enhance={() => {
        return async ({ result }) => {
          if (result.type === 'success') {
            open = false;
          }
        };
      }}
      class="mt-6 space-y-6"
    >
      {#if mode === 'edit' && project}
        <input type="hidden" name="id" value={project.id} />
      {/if}

      <div class="space-y-2">
        <Label for="name" class="text-sm font-medium">Project Name</Label>
        <Input
          id="name"
          name="name"
          value={project?.name ?? ''}
          required
          maxlength={100}
          placeholder="e.g., Home Renovation"
          class="focus-visible:ring-primary"
        />
        <p class="text-xs text-foreground-muted">Maximum 100 characters</p>
      </div>

      <SheetFooter class="flex gap-2">
        <Button type="button" variant="outline" onclick={() => (open = false)}>Cancel</Button>
        <Button type="submit" class="bg-primary hover:bg-primary-hover text-white">
          {submitLabel}
        </Button>
      </SheetFooter>
    </form>
  </SheetContent>
</Sheet>
