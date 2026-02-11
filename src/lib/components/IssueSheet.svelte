<script lang="ts">
  /**
   * IssueSheet Component - North Design System
   *
   * Bottom sheet/drawer for editing issue details.
   * Mobile-first design pattern.
   *
   * North Design Principles:
   * - White surface with level 2 shadow
   * - Sections separated by 24px spacing (not heavy borders)
   * - Labels: 12px uppercase, muted color
   * - Input spacing: 8px between label and control
   * - Clean, minimal sections
   *
   * Requirements from CLAUDE.md:
   * - Editable fields: title, status, priority, story_points, epic, milestone
   * - Inline dependency display (Blocked by / Blocking)
   * - Collapsible sub-issues list
   * - Form actions for mutations
   */

  import type { Issue } from '$lib/types';
  import { Sheet, SheetContent, SheetHeader, SheetTitle } from '$lib/components/ui/sheet';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Button } from '$lib/components/ui/button';
  import { Badge } from '$lib/components/ui/badge';
  import type { IssueStatus } from '$lib/types';

  export let open = false;
  export let issue: Issue | null = null;

  // Helper to get status badge variant
  function getStatusVariant(
    status: IssueStatus,
  ):
    | 'secondary'
    | 'default'
    | 'outline'
    | 'destructive'
    | 'status-todo'
    | 'status-doing'
    | 'status-in-review'
    | 'status-done'
    | 'status-blocked'
    | 'status-canceled'
    | undefined {
    const variantMap: Record<IssueStatus, any> = {
      todo: 'status-todo',
      doing: 'status-doing',
      in_review: 'status-in-review',
      done: 'status-done',
      canceled: 'status-canceled',
    };
    return variantMap[status];
  }

  // TODO: Add Select components for epic, status, priority
  // TODO: Add dependency management UI
  // TODO: Add sub-issues collapsible list
  // TODO: Implement form submission with SvelteKit actions
</script>

<Sheet bind:open>
  <SheetContent side="bottom" class="max-h-[85vh] overflow-y-auto">
    {#if issue}
      <!-- Header with serif font per North spec -->
      <SheetHeader class="mb-6">
        <SheetTitle class="font-accent text-page-title">Edit Issue</SheetTitle>
      </SheetHeader>

      <form method="POST" action="?/updateIssue" class="space-y-6 pb-6">
        <input type="hidden" name="id" value={issue.id} />

        <!-- Basic Info Section -->
        <section>
          <h3 class="text-xs uppercase font-medium text-foreground-muted mb-3 tracking-wide">
            Basic Info
          </h3>
          <div class="space-y-4">
            <div>
              <Label for="title" class="text-metadata mb-2 block">Title</Label>
              <Input id="title" name="title" value={issue.title} required class="text-body" />
            </div>

            <!-- TODO: Replace with actual Select components -->
            <div class="flex gap-4">
              <div class="flex-1">
                <Label for="status" class="text-metadata mb-2 block">Status</Label>
                <Badge variant={getStatusVariant(issue.status)} class="w-full justify-center py-2">
                  {issue.status}
                </Badge>
              </div>

              <div class="flex-1">
                <Label for="priority" class="text-metadata mb-2 block">Priority</Label>
                <Badge variant="default" class="w-full justify-center py-2">
                  P{issue.priority}
                </Badge>
              </div>
            </div>
          </div>
        </section>

        <!-- Organization Section -->
        <section>
          <h3 class="text-xs uppercase font-medium text-foreground-muted mb-3 tracking-wide">
            Organization
          </h3>
          <div class="space-y-4">
            <!-- TODO: Add Epic Select -->
            <div>
              <Label for="epic" class="text-metadata mb-2 block">Epic</Label>
              <div class="text-body text-foreground-secondary">{issue.epic?.name}</div>
            </div>

            <!-- TODO: Add Milestone Select -->
            {#if issue.milestone}
              <div>
                <Label for="milestone" class="text-metadata mb-2 block">Milestone</Label>
                <div class="text-body text-foreground-secondary">{issue.milestone}</div>
              </div>
            {/if}
          </div>
        </section>

        <!-- Estimation Section -->
        <section>
          <h3 class="text-xs uppercase font-medium text-foreground-muted mb-3 tracking-wide">
            Estimation
          </h3>
          <div>
            <Label for="story_points" class="text-metadata mb-2 block">Story Points</Label>
            <!-- TODO: Add Select for story points (1, 2, 3, 5, 8, 13, 21) -->
            <div class="text-body text-foreground-secondary">
              {issue.story_points || 'Not set'}
            </div>
          </div>
        </section>

        <!-- Dependencies Section -->
        <section>
          <h3 class="text-xs uppercase font-medium text-foreground-muted mb-3 tracking-wide">
            Dependencies
          </h3>
          <div class="text-metadata">
            <!-- TODO: Implement dependency display and management -->
            <p class="text-foreground-muted">No dependencies</p>
            <!-- TODO: Add "Add dependency" button -->
          </div>
        </section>

        <!-- Sub-issues Section -->
        <section>
          <h3 class="text-xs uppercase font-medium text-foreground-muted mb-3 tracking-wide">
            Sub-issues
          </h3>
          <div class="text-metadata">
            <!-- TODO: Implement collapsible sub-issues list -->
            <p class="text-foreground-muted">No sub-issues</p>
            <!-- TODO: Add "Add sub-issue" button -->
          </div>
        </section>

        <!-- Actions -->
        <div class="flex gap-3 pt-4">
          <Button type="submit" variant="default" class="flex-1">Save</Button>
          <Button type="button" variant="secondary" class="flex-1" onclick={() => (open = false)}>
            Cancel
          </Button>
        </div>
      </form>
    {/if}
  </SheetContent>
</Sheet>

<!-- TODO: Add form validation -->
<!-- TODO: Add loading states -->
<!-- TODO: Add error handling -->
