<script lang="ts">
	/**
	 * EpicCard Component - North Design System
	 *
	 * Displays an epic card with issue counts.
	 * Used in: Project detail view
	 *
	 * North Design Principles:
	 * - 10px border radius for cards
	 * - Subtle border, no heavy shadows
	 * - Minimal hover states
	 * - Clean typography hierarchy
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

	// Status badge variant mapping
	const getStatusVariant = (status: string) => {
		if (status === 'active') return 'default';
		if (status === 'done') return 'status-done';
		return 'status-canceled';
	};
</script>

<!-- North Design: Card with 10px radius, subtle border, minimal hover -->
<a href="/epics/{epic.id}" class="block">
	<Card
		class="hover:shadow-level-1 transition-shadow duration-150 cursor-pointer border-border rounded-md"
	>
		<CardHeader class="pb-4">
			<div class="flex items-center justify-between gap-3">
				<!-- Epic name: section header weight -->
				<h3 class="text-section-header font-ui flex-1 min-w-0 truncate">{epic.name}</h3>
				<!-- Status badge: subtle, not loud -->
				<Badge variant={getStatusVariant(epic.status)} class="text-xs shrink-0">
					{epic.status}
				</Badge>
			</div>
		</CardHeader>
		<CardContent>
			<!-- Counts with subtle badges in 2x2 grid -->
			<div class="grid grid-cols-2 gap-3 text-metadata">
				<div class="flex items-center gap-2">
					<Badge variant="status-todo" class="text-xs">{todoCount}</Badge>
					<span class="text-foreground-secondary">Todo</span>
				</div>
				<div class="flex items-center gap-2">
					<Badge variant="status-doing" class="text-xs">{doingCount}</Badge>
					<span class="text-foreground-secondary">Doing</span>
				</div>
				<div class="flex items-center gap-2">
					<Badge variant="status-blocked" class="text-xs">{blockedCount}</Badge>
					<span class="text-foreground-secondary">Blocked</span>
				</div>
				<div class="flex items-center gap-2">
					<Badge variant="status-done" class="text-xs">{doneCount}</Badge>
					<span class="text-foreground-secondary">Done</span>
				</div>
			</div>
		</CardContent>
	</Card>
</a>

<!-- TODO: Implement count calculations from loaded data -->
<!-- TODO: Handle "Unassigned" epic display differently -->
