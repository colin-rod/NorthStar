<script lang="ts">
  import { Dialog, DialogContent, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
  import { storyPointsPickerOpen, focusedIssue } from '$lib/stores/keyboard';
  import { VALID_STORY_POINTS } from '$lib/constants/validation';
  import { deserialize } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { toast } from 'svelte-sonner';

  async function pick(points: number | null) {
    const issue = $focusedIssue;
    if (!issue) return;
    storyPointsPickerOpen.set(false);

    const formData = new FormData();
    formData.append('id', issue.id);
    formData.append('story_points', points?.toString() ?? '');

    const response = await fetch('?/updateIssue', { method: 'POST', body: formData });
    const result = deserialize(await response.text());

    if (result.type === 'success') {
      await invalidateAll();
    } else {
      toast.error('Failed to update story points', { duration: 4000 });
    }
  }
</script>

<Dialog bind:open={$storyPointsPickerOpen}>
  <DialogContent class="max-w-xs">
    <DialogHeader>
      <DialogTitle>Set Story Points</DialogTitle>
    </DialogHeader>

    <div class="grid grid-cols-4 gap-2">
      {#each VALID_STORY_POINTS as pts (pts)}
        <button
          onclick={() => pick(pts)}
          class="rounded border px-3 py-2 text-sm font-mono hover:bg-surface-subtle transition-colors
            {$focusedIssue?.story_points === pts
            ? 'border-primary bg-primary/10 font-semibold'
            : 'border-border'}"
        >
          {pts}
        </button>
      {/each}
    </div>

    <button
      onclick={() => pick(null)}
      class="mt-1 w-full rounded border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-surface-subtle transition-colors"
    >
      Clear
    </button>
  </DialogContent>
</Dialog>
