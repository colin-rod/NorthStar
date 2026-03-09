<script lang="ts">
  import { enhance } from '$app/forms';
  import { Button } from '$lib/components/ui/button';
  import { Card, CardHeader, CardContent } from '$lib/components/ui/card';
  import type { ActionData } from './$types';
  import { CSV_TEMPLATES, type ImportEntityType } from '$lib/utils/csv-import';

  let { form }: { form: ActionData } = $props();

  let entityType = $state<ImportEntityType>('issues');
  let fileInput = $state<HTMLInputElement | null>(null);
  let fileName = $state('');
  let importing = $state(false);

  const entityLabels: Record<ImportEntityType, string> = {
    projects: 'Projects',
    epics: 'Epics',
    issues: 'Issues',
  };

  const columnDocs: Record<ImportEntityType, { col: string; required: boolean; notes: string }[]> =
    {
      projects: [
        { col: 'name', required: true, notes: 'Project name (max 100 chars)' },
        {
          col: 'status',
          required: false,
          notes: 'backlog | planned | active | on_hold | completed | canceled (default: backlog)',
        },
      ],
      epics: [
        { col: 'name', required: true, notes: 'Epic name (max 100 chars)' },
        { col: 'project_name', required: true, notes: 'Exact name of an existing project' },
        {
          col: 'status',
          required: false,
          notes: 'backlog | active | on_hold | completed | canceled (default: backlog)',
        },
      ],
      issues: [
        { col: 'title', required: true, notes: 'Issue title (max 500 chars)' },
        { col: 'project_name', required: true, notes: 'Exact name of an existing project' },
        {
          col: 'epic_name',
          required: false,
          notes: 'Exact name of an existing epic in that project (default: Unassigned)',
        },
        {
          col: 'status',
          required: false,
          notes: 'backlog | todo | in_progress | in_review | done | canceled (default: todo)',
        },
        { col: 'priority', required: false, notes: '0 (P0) to 3 (P3) (default: 2)' },
        {
          col: 'story_points',
          required: false,
          notes: '1 | 2 | 3 | 5 | 8 | 13 | 21 (leave blank for none)',
        },
      ],
    };

  function downloadTemplate() {
    const csv = CSV_TEMPLATES[entityType];
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entityType}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function onFileChange(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    fileName = input.files?.[0]?.name ?? '';
  }

  // Reset file input when entity type changes
  $effect(() => {
    if (entityType && fileInput) {
      fileInput.value = '';
      fileName = '';
    }
  });
</script>

<div class="space-y-6 max-w-2xl">
  <h1 class="font-accent text-page-title">Import CSV</h1>

  <!-- Entity type selector -->
  <Card>
    <CardHeader>
      <h2 class="text-section-header">What are you importing?</h2>
    </CardHeader>
    <CardContent>
      <div class="flex gap-2">
        {#each ['projects', 'epics', 'issues'] as ImportEntityType[] as type}
          <button
            type="button"
            onclick={() => (entityType = type)}
            class="px-4 py-2 rounded-md text-sm font-medium transition-colors border {entityType ===
            type
              ? 'bg-primary text-primary-foreground border-primary'
              : 'border-border text-foreground-muted hover:bg-surface-subtle hover:text-foreground'}"
          >
            {entityLabels[type]}
          </button>
        {/each}
      </div>
    </CardContent>
  </Card>

  <!-- Column reference -->
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <h2 class="text-section-header">CSV Format — {entityLabels[entityType]}</h2>
        <Button variant="outline" size="sm" onclick={downloadTemplate}>Download template</Button>
      </div>
    </CardHeader>
    <CardContent>
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left border-b border-border-divider">
            <th class="pb-2 pr-4 font-medium text-foreground-muted">Column</th>
            <th class="pb-2 pr-4 font-medium text-foreground-muted">Required</th>
            <th class="pb-2 font-medium text-foreground-muted">Notes</th>
          </tr>
        </thead>
        <tbody>
          {#each columnDocs[entityType] as col}
            <tr class="border-b border-border-divider last:border-0">
              <td class="py-2 pr-4 font-mono text-xs">{col.col}</td>
              <td class="py-2 pr-4">
                {#if col.required}
                  <span class="text-destructive font-medium">Yes</span>
                {:else}
                  <span class="text-foreground-muted">No</span>
                {/if}
              </td>
              <td class="py-2 text-foreground-muted">{col.notes}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </CardContent>
  </Card>

  <!-- Upload form -->
  <Card>
    <CardHeader>
      <h2 class="text-section-header">Upload CSV</h2>
    </CardHeader>
    <CardContent>
      <form
        method="POST"
        action="?/import"
        enctype="multipart/form-data"
        use:enhance={() => {
          importing = true;
          return async ({ update }) => {
            await update();
            importing = false;
            if (fileInput) {
              fileInput.value = '';
              fileName = '';
            }
          };
        }}
      >
        <input type="hidden" name="entity_type" value={entityType} />

        <div class="space-y-4">
          <label class="block">
            <span class="text-sm font-medium text-foreground-muted mb-1 block">Select CSV file</span
            >
            <input
              type="file"
              name="file"
              accept=".csv,text/csv"
              required
              bind:this={fileInput}
              onchange={onFileChange}
              class="block w-full text-sm text-foreground-muted file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
            />
            {#if fileName}
              <span class="text-xs text-foreground-muted mt-1 block">Selected: {fileName}</span>
            {/if}
          </label>

          <Button type="submit" disabled={importing}>
            {importing ? 'Importing…' : `Import ${entityLabels[entityType]}`}
          </Button>
        </div>
      </form>
    </CardContent>
  </Card>

  <!-- Results -->
  {#if form}
    {#if form.success}
      <Card>
        <CardContent class="pt-6">
          <div class="flex items-center gap-3 text-green-700 dark:text-green-400">
            <span class="text-2xl">✓</span>
            <p class="font-medium">
              Successfully imported {form.imported}
              {entityLabels[(form.entityType as ImportEntityType) ?? entityType].toLowerCase()}.
            </p>
          </div>
        </CardContent>
      </Card>
    {:else}
      <Card>
        <CardContent class="pt-6 space-y-3">
          <p class="font-medium text-destructive">Import failed</p>

          {#if form.error}
            <p class="text-sm text-foreground-muted">{form.error}</p>
          {/if}

          {#if form.parseErrors && form.parseErrors.length > 0}
            <ul class="text-sm space-y-1">
              {#each form.parseErrors as err}
                <li class="text-destructive">
                  {#if err.row === 0}
                    Header error: {err.message}
                  {:else}
                    Row {err.row}: {err.message}
                  {/if}
                </li>
              {/each}
            </ul>
          {/if}
        </CardContent>
      </Card>
    {/if}
  {/if}
</div>
