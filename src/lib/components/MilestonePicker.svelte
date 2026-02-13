<script lang="ts">
  /**
   * MilestonePicker Component - North Design System
   *
   * Enhanced milestone picker with inline create/edit functionality.
   * Replaces native select with a popover-based UI.
   *
   * North Design Principles:
   * - Clean, scannable list of milestones
   * - Inline creation and editing within popover
   * - Formatted due dates
   * - Keyboard-friendly
   *
   * Requirements from CLAUDE.md:
   * - Select milestone from list
   * - Create new milestone inline
   * - Edit existing milestone inline
   * - Mobile-first responsive design
   */

  import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
  import { Button } from '$lib/components/ui/button';
  import MilestoneForm from './MilestoneForm.svelte';
  import type { Issue, Milestone } from '$lib/types';
  import { Calendar, ChevronDown, Edit, Plus } from '@lucide/svelte';

  interface Props {
    selectedMilestoneId: string | null;
    milestones: Milestone[];
    issues?: Issue[];
    disabled?: boolean;
    onChange: (milestoneId: string | null) => void;
  }

  let {
    selectedMilestoneId,
    milestones,
    issues = [],
    disabled = false,
    onChange,
  }: Props = $props();

  // Calculate progress per milestone
  let milestoneProgress = $derived.by(() => {
    const progress = new Map<string, { completed: number; total: number; percentage: number }>();
    for (const milestone of milestones) {
      const milestoneIssues = issues.filter((i) => i.milestone_id === milestone.id);
      const total = milestoneIssues.length;
      const completed = milestoneIssues.filter(
        (i) => i.status === 'done' || i.status === 'canceled',
      ).length;
      progress.set(milestone.id, {
        completed,
        total,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      });
    }
    return progress;
  });

  // State
  let open = $state(false);
  let showCreateForm = $state(false);
  let editingMilestone = $state<Milestone | null>(null);

  // Find selected milestone
  const selectedMilestone = $derived(milestones.find((m) => m.id === selectedMilestoneId) || null);

  // Format due date for display
  function formatDueDate(dueDate: string | null): string {
    if (!dueDate) return '';
    const date = new Date(dueDate);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  // Handle milestone selection
  function handleSelect(milestoneId: string | null) {
    onChange(milestoneId);
    open = false;
    showCreateForm = false;
    editingMilestone = null;
  }

  // Handle create button click
  function handleCreateClick() {
    showCreateForm = true;
    editingMilestone = null;
  }

  // Handle edit button click
  function handleEditClick(milestone: Milestone, e: MouseEvent) {
    e.stopPropagation(); // Prevent milestone selection
    editingMilestone = milestone;
    showCreateForm = false;
  }

  // Handle form success (create or edit)
  function handleFormSuccess() {
    showCreateForm = false;
    editingMilestone = null;
    // Popover remains open to show updated list
  }

  // Handle form cancel
  function handleFormCancel() {
    showCreateForm = false;
    editingMilestone = null;
  }
</script>

<Popover bind:open>
  <PopoverTrigger
    class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    {disabled}
  >
    <span class="flex items-center gap-2">
      <Calendar class="h-4 w-4" />
      {#if selectedMilestone}
        <span class="font-normal">
          {selectedMilestone.name}
        </span>
        {#if selectedMilestone.due_date}
          <span class="text-muted-foreground text-xs">
            {formatDueDate(selectedMilestone.due_date)}
          </span>
        {/if}
      {:else}
        <span class="font-normal text-muted-foreground">No milestone</span>
      {/if}
    </span>
    <ChevronDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
  </PopoverTrigger>

  <PopoverContent class="w-[320px] p-0" align="start">
    {#if showCreateForm}
      <!-- Create Form -->
      <div class="p-4">
        <h4 class="text-section-header mb-4">Create Milestone</h4>
        <MilestoneForm mode="create" onSuccess={handleFormSuccess} onCancel={handleFormCancel} />
      </div>
    {:else if editingMilestone}
      <!-- Edit Form -->
      <div class="p-4">
        <h4 class="text-section-header mb-4">Edit Milestone</h4>
        <MilestoneForm
          mode="edit"
          milestone={editingMilestone}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </div>
    {:else}
      <!-- Milestone List -->
      <div class="p-2">
        <!-- Clear milestone option -->
        <button
          type="button"
          onclick={() => handleSelect(null)}
          class="flex w-full items-center justify-between rounded-sm px-3 py-2 text-sm hover:bg-muted cursor-pointer"
        >
          <span class="text-muted-foreground">Clear milestone</span>
        </button>

        <!-- Separator -->
        <div class="my-2 h-px bg-border"></div>

        <!-- Milestone options -->
        {#each milestones as milestone (milestone.id)}
          {@const prog = milestoneProgress.get(milestone.id)}
          <div
            class="group flex flex-col gap-1 rounded-sm px-3 py-2 text-sm hover:bg-muted cursor-pointer"
          >
            <div class="flex w-full items-center justify-between">
              <button
                type="button"
                onclick={() => handleSelect(milestone.id)}
                class="flex flex-col items-start gap-1 flex-1 text-left"
              >
                <span class="font-medium">{milestone.name}</span>
                {#if milestone.due_date}
                  <span class="text-xs text-muted-foreground">
                    {formatDueDate(milestone.due_date)}
                  </span>
                {/if}
              </button>

              <!-- Edit icon (visible on hover) -->
              <button
                type="button"
                onclick={(e) => handleEditClick(milestone, e)}
                class="opacity-0 group-hover:opacity-100 p-1 hover:bg-accent rounded transition-opacity"
                aria-label="Edit milestone"
              >
                <Edit class="h-3 w-3" />
              </button>
            </div>
            {#if prog && prog.total > 0}
              <div class="flex items-center gap-2 w-full">
                <div class="flex-1 h-[3px] bg-muted rounded-full overflow-hidden">
                  <div
                    class="h-full bg-foreground/40 rounded-full transition-all duration-300"
                    style="width: {prog.percentage}%"
                  ></div>
                </div>
                <span class="text-xs text-muted-foreground shrink-0">
                  {prog.completed}/{prog.total}
                </span>
              </div>
            {/if}
          </div>
        {/each}

        <!-- Separator -->
        <div class="my-2 h-px bg-border"></div>

        <!-- Create milestone button -->
        <button
          type="button"
          onclick={handleCreateClick}
          class="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-muted cursor-pointer text-primary"
        >
          <Plus class="h-4 w-4" />
          <span>Create milestone</span>
        </button>
      </div>
    {/if}
  </PopoverContent>
</Popover>
