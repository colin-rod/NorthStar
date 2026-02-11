<script lang="ts">
	/**
	 * EpicCard Component
	 *
	 * Displays an epic card with issue counts.
	 * Used in: Project detail view
	 *
	 * Requirements from CLAUDE.md:
	 * - Show epic name and status
	 * - Show issue counts (Ready, Blocked, Doing)
	 * - Clickable to navigate to epic detail
	 */

	import type { Epic } from '$lib/types';
	import { Card, CardHeader, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';

	export let epic: Epic;

	// TODO: Calculate counts from epic.issues
	const todoCount = 0;
	const doingCount = 0;
	const blockedCount = 0;
	const doneCount = 0;
</script>

<a href="/epics/{epic.id}">
	<Card class="hover:shadow-md transition-shadow cursor-pointer">
		<CardHeader>
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-semibold">{epic.name}</h3>
				<Badge variant={epic.status === 'active' ? 'default' : 'secondary'}>
					{epic.status}
				</Badge>
			</div>
		</CardHeader>
		<CardContent>
			<div class="grid grid-cols-2 gap-2 text-sm">
				<div class="flex items-center gap-1">
					<Badge variant="outline">{todoCount}</Badge>
					<span class="text-muted-foreground">Todo</span>
				</div>
				<div class="flex items-center gap-1">
					<Badge variant="secondary">{doingCount}</Badge>
					<span class="text-muted-foreground">Doing</span>
				</div>
				<div class="flex items-center gap-1">
					<Badge variant="destructive">{blockedCount}</Badge>
					<span class="text-muted-foreground">Blocked</span>
				</div>
				<div class="flex items-center gap-1">
					<Badge variant="default">{doneCount}</Badge>
					<span class="text-muted-foreground">Done</span>
				</div>
			</div>
		</CardContent>
	</Card>
</a>

<!-- TODO: Implement count calculations from loaded data -->
<!-- TODO: Handle "Unassigned" epic display differently -->
