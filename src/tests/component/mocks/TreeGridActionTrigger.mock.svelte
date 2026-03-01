<script lang="ts">
  let {
    onToggleExpand = (_id: string) => {},
    onToggleSelect = (_id: string) => {},
    onEditModeChange = (_enabled: boolean) => {},
    onCellEdit = (_nodeId: string, _field: string, _value: any) => {},
    onCreateChild = (_parentId: string, _parentType: string, _data: { title: string }) => {},
    onBulkAction = (_action: string) => {},
    onShowToast = (_message: string, _type: 'success' | 'error') => {},
    onIssueClick = (_issue: any) => {},
    onProjectClick = (_project: any, _counts: any, _metrics: any, _epics: any[]) => {},
    onEpicClick = (_epic: any, _counts: any) => {},
    onContextMenu = (_node: any, _event: MouseEvent) => {},
  }: {
    onToggleExpand?: (id: string) => void;
    onToggleSelect?: (id: string) => void;
    onEditModeChange?: (enabled: boolean) => void;
    onCellEdit?: (nodeId: string, field: string, value: any) => void;
    onCreateChild?: (parentId: string, parentType: string, data: { title: string }) => void;
    onBulkAction?: (action: string) => void;
    onShowToast?: (message: string, type: 'success' | 'error') => void;
    onIssueClick?: (issue: any) => void;
    onProjectClick?: (project: any, counts: any, metrics: any, epics: any[]) => void;
    onEpicClick?: (epic: any, counts: any) => void;
    onContextMenu?: (node: any, event: MouseEvent) => void;
  } = $props();
</script>

<button type="button" onclick={() => onToggleExpand('project-1')}>Toggle expand project</button>
<button type="button" onclick={() => onToggleExpand('epic-1')}>Toggle expand epic</button>
<button type="button" onclick={() => onToggleSelect('issue-1')}>Toggle select</button>
<button type="button" onclick={() => onEditModeChange(true)}>Enable edit mode</button>
<button type="button" onclick={() => onCellEdit('project-1', 'name', 'New Name')}
  >Cell edit project</button
>
<button type="button" onclick={() => onCellEdit('epic-1', 'status', 'done')}>Cell edit epic</button>
<button type="button" onclick={() => onCellEdit('issue-1', 'priority', '1')}>Cell edit issue</button
>
<button type="button" onclick={() => onCreateChild('project-1', 'project', { title: 'New Epic' })}
  >Create epic child</button
>
<button type="button" onclick={() => onCreateChild('epic-1', 'epic', { title: 'New Issue' })}
  >Create issue child</button
>
<button type="button" onclick={() => onCreateChild('issue-1', 'issue', { title: 'New Sub-issue' })}
  >Create sub-issue child</button
>
<button type="button" onclick={() => onShowToast('Saved from grid', 'success')}>Emit success</button
>
<button type="button" onclick={() => onShowToast('Failed from grid', 'error')}>Emit error</button>
<button type="button" onclick={() => onIssueClick({ id: 'issue-1', title: 'Issue 1' })}
  >Issue click</button
>
<button
  type="button"
  onclick={() =>
    onProjectClick(
      { id: 'project-1', name: 'Project One' },
      { total: 1, done: 0, canceled: 0, blocked: 0 },
      {
        totalIssues: 1,
        completedIssues: 0,
        completionPercent: 0,
        totalStoryPoints: 0,
        completedStoryPoints: 0,
        highestPriority: 0,
      },
      [
        {
          id: 'epic-1',
          name: 'Epic One',
          project_id: 'project-1',
          status: 'active',
          is_default: false,
        },
      ],
    )}>Project click</button
>
<button
  type="button"
  onclick={() =>
    onEpicClick(
      {
        id: 'epic-1',
        name: 'Epic One',
        project_id: 'project-1',
        status: 'active',
        is_default: false,
        issues: [],
      },
      { total: 0, done: 0, canceled: 0, blocked: 0 },
    )}>Epic click</button
>
<button
  type="button"
  onclick={(e) =>
    onContextMenu(
      {
        id: 'project-1',
        type: 'project',
        label: 'Project One',
        data: { id: 'project-1', name: 'Project One' },
        children: [],
      },
      e,
    )}>Context menu project</button
>
<button
  type="button"
  onclick={(e) =>
    onContextMenu(
      {
        id: 'epic-1',
        type: 'epic',
        label: 'Epic One',
        data: {
          id: 'epic-1',
          name: 'Epic One',
          project_id: 'project-1',
          status: 'active',
          is_default: false,
        },
        children: [],
      },
      e,
    )}>Context menu epic</button
>
<button
  type="button"
  onclick={(e) =>
    onContextMenu(
      {
        id: 'issue-1',
        type: 'issue',
        label: 'Issue One',
        data: { id: 'issue-1', title: 'Issue One' },
        children: [],
      },
      e,
    )}>Context menu issue</button
>
