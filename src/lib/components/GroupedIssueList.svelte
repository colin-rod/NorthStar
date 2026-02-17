<script lang="ts">
  import type { Issue, IssueGroup, GroupByMode } from '$lib/types';
  import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
  } from '$lib/components/ui/collapsible';
  import GroupHeader from '$lib/components/GroupHeader.svelte';
  import IssueList from '$lib/components/IssueList.svelte';

  interface Props {
    issues: Issue[];
    groupBy: GroupByMode;
    onIssueClick: (issue: Issue) => void;
  }

  let { issues, groupBy, onIssueClick }: Props = $props();

  // State for tracking which groups are expanded (all start expanded)
  let expandedGroups = $state<Set<string>>(new Set());

  // Group issues based on groupBy mode
  let groupedIssues = $derived.by((): IssueGroup[] => {
    if (groupBy === 'none') return [];

    const groups = new Map<string, Issue[]>();

    for (const issue of issues) {
      let key: string;
      let name: string;

      switch (groupBy) {
        case 'project':
          key = issue.project_id;
          name = issue.project?.name || 'Unknown Project';
          break;
        case 'status':
          key = issue.status;
          name =
            issue.status
              .split('_')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ') || 'Unknown Status';
          break;
        case 'priority':
          key = `priority-${issue.priority}`;
          name = `P${issue.priority}`;
          break;
        case 'milestone':
          key = issue.milestone_id || 'no-milestone';
          name = issue.milestone?.name || 'No Milestone';
          break;
        case 'story_points':
          key = issue.story_points !== null ? `sp-${issue.story_points}` : 'no-story-points';
          name = issue.story_points !== null ? `${issue.story_points} points` : 'No Story Points';
          break;
        default:
          key = 'unknown';
          name = 'Unknown';
      }

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(issue);
    }

    // Convert to IssueGroup array with computed stats
    const result: IssueGroup[] = [];
    for (const [key, groupIssues] of groups.entries()) {
      const name = groupIssues[0]
        ? (() => {
            switch (groupBy) {
              case 'project':
                return groupIssues[0].project?.name || 'Unknown Project';
              case 'status':
                return (
                  groupIssues[0].status
                    .split('_')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ') || 'Unknown Status'
                );
              case 'priority':
                return `P${groupIssues[0].priority}`;
              case 'milestone':
                return groupIssues[0].milestone?.name || 'No Milestone';
              case 'story_points':
                return groupIssues[0].story_points !== null
                  ? `${groupIssues[0].story_points} points`
                  : 'No Story Points';
              default:
                return 'Unknown';
            }
          })()
        : 'Unknown';

      const issueCount = groupIssues.length;
      const totalStoryPoints = groupIssues.reduce(
        (sum, issue) => sum + (issue.story_points || 0),
        0,
      );

      // Completion % = done issues / (total - canceled)
      const nonCanceledIssues = groupIssues.filter((i) => i.status !== 'canceled');
      const doneIssues = groupIssues.filter((i) => i.status === 'done');
      const completionPercent =
        nonCanceledIssues.length > 0 ? (doneIssues.length / nonCanceledIssues.length) * 100 : 0;

      result.push({
        key,
        name,
        issues: groupIssues,
        issueCount,
        totalStoryPoints,
        completionPercent,
      });
    }

    // Sort groups
    if (groupBy === 'priority') {
      // Sort by priority number (P0 first)
      result.sort((a, b) => {
        const priorityA = parseInt(a.key.replace('priority-', ''));
        const priorityB = parseInt(b.key.replace('priority-', ''));
        return priorityA - priorityB;
      });
    } else if (groupBy === 'story_points') {
      // Sort by story points (highest first, then no points at end)
      result.sort((a, b) => {
        if (a.key === 'no-story-points') return 1;
        if (b.key === 'no-story-points') return -1;
        const pointsA = parseInt(a.key.replace('sp-', ''));
        const pointsB = parseInt(b.key.replace('sp-', ''));
        return pointsB - pointsA; // Descending
      });
    } else {
      // Sort alphabetically by name
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Initialize all groups as expanded
    const allKeys = new Set(result.map((g) => g.key));
    expandedGroups = allKeys;

    return result;
  });

  function toggleGroup(key: string) {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    expandedGroups = newExpanded;
  }
</script>

{#if groupedIssues.length === 0}
  <div class="text-center py-12">
    <p class="text-metadata text-foreground-muted">No issues found</p>
  </div>
{:else}
  <div class="space-y-2">
    {#each groupedIssues as group (group.key)}
      <Collapsible open={expandedGroups.has(group.key)} onOpenChange={() => toggleGroup(group.key)}>
        <CollapsibleTrigger class="w-full">
          <GroupHeader
            groupName={group.name}
            issueCount={group.issueCount}
            totalStoryPoints={group.totalStoryPoints}
            completionPercent={group.completionPercent}
            isExpanded={expandedGroups.has(group.key)}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div class="pl-6">
            <IssueList issues={group.issues} {onIssueClick} />
          </div>
        </CollapsibleContent>
      </Collapsible>
    {/each}
  </div>
{/if}
