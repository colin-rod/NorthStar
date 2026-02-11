<script lang="ts">
	/**
	 * IssueRow Component
	 *
	 * Displays a single issue in a list view.
	 * Used in: Home view, Epic view
	 *
	 * Requirements from CLAUDE.md:
	 * - Show title, project/epic, priority, blocked indicator
	 * - Mobile-first responsive design
	 * - Clickable to open IssueSheet drawer
	 */

	import type { Issue } from '$lib/types';
	import { Badge } from '$lib/components/ui/badge';

	export let issue: Issue;
	export let onClick: () => void = () => {};

	// TODO: Implement isBlocked() from lib/utils/issue-helpers.ts
	const isBlocked = false;
</script>

<button
	on:click={onClick}
	class="w-full text-left p-4 border-b hover:bg-muted/50 transition-colors"
>
	<div class="flex items-center justify-between gap-2">
		<div class="flex-1 min-w-0">
			<h3 class="font-medium truncate">{issue.title}</h3>
			<p class="text-sm text-muted-foreground truncate">
				{issue.project?.name} / {issue.epic?.name}
			</p>
		</div>

		<div class="flex items-center gap-2 shrink-0">
			<!-- Priority Badge -->
			<Badge variant="outline">P{issue.priority}</Badge>

			<!-- Blocked Indicator -->
			{#if isBlocked}
				<Badge variant="destructive">Blocked</Badge>
			{/if}

			<!-- Status Badge -->
			<Badge>{issue.status}</Badge>
		</div>
	</div>
</button>

<!-- TODO: Add accessibility attributes (aria-label, role) -->
<!-- TODO: Add keyboard navigation support -->
<!-- TODO: Connect to actual isBlocked() computation -->
