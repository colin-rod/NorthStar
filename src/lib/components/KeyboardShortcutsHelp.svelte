<script lang="ts">
  import { Dialog, DialogContent, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
  import { shortcutsHelpOpen } from '$lib/stores/keyboard';
</script>

<Dialog bind:open={$shortcutsHelpOpen}>
  <DialogContent class="max-w-sm">
    <DialogHeader>
      <DialogTitle>Keyboard Shortcuts</DialogTitle>
    </DialogHeader>

    <div class="space-y-4 text-sm">
      <div>
        <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Global
        </p>
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <span>New issue</span>
            <kbd class="px-1.5 py-0.5 text-xs font-mono border rounded bg-muted">n</kbd>
          </div>
          <div class="flex items-center justify-between">
            <span>Search</span>
            <kbd class="px-1.5 py-0.5 text-xs font-mono border rounded bg-muted">⌘K</kbd>
          </div>
          <div class="flex items-center justify-between">
            <span>Toggle shortcuts</span>
            <kbd class="px-1.5 py-0.5 text-xs font-mono border rounded bg-muted">?</kbd>
          </div>
        </div>
      </div>

      <div>
        <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Issue Actions <span class="normal-case font-normal">(hover an issue)</span>
        </p>
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <span>Edit issue</span>
            <kbd class="px-1.5 py-0.5 text-xs font-mono border rounded bg-muted">e</kbd>
          </div>
          <div class="flex items-center justify-between">
            <span>Cycle status</span>
            <kbd class="px-1.5 py-0.5 text-xs font-mono border rounded bg-muted">c</kbd>
          </div>
          <div class="flex items-center justify-between">
            <span>Set priority P0 – P3</span>
            <div class="flex gap-1">
              <kbd class="px-1.5 py-0.5 text-xs font-mono border rounded bg-muted">1</kbd>
              <kbd class="px-1.5 py-0.5 text-xs font-mono border rounded bg-muted">2</kbd>
              <kbd class="px-1.5 py-0.5 text-xs font-mono border rounded bg-muted">3</kbd>
              <kbd class="px-1.5 py-0.5 text-xs font-mono border rounded bg-muted">4</kbd>
            </div>
          </div>
          <div class="flex items-center justify-between">
            <span>Set story points</span>
            <kbd class="px-1.5 py-0.5 text-xs font-mono border rounded bg-muted">s</kbd>
          </div>
        </div>
      </div>
    </div>
  </DialogContent>
</Dialog>
