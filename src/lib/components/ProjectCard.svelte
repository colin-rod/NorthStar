<script lang="ts">
	/**
	 * ProjectCard Component
	 *
	 * Displays a project card with epic counts.
	 * Used in: Projects list view
	 *
	 * Requirements from CLAUDE.md:
	 * - Show project name
	 * - Show epic counts (Ready, Blocked, Doing)
	 * - Clickable to navigate to project detail
	 */

	import type { Project } from '$lib/types';
	import { Card, CardHeader, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';

	export let project: Project;

	// TODO: Calculate counts from project.epics
	const readyCount = 0;
	const blockedCount = 0;
	const doingCount = 0;
</script>

<a href="/projects/{project.id}">
	<Card class="hover:shadow-md transition-shadow cursor-pointer">
		<CardHeader>
			<h3 class="text-lg font-semibold">{project.name}</h3>
		</CardHeader>
		<CardContent>
			<div class="flex gap-4 text-sm">
				<div class="flex items-center gap-1">
					<Badge variant="default">{readyCount}</Badge>
					<span class="text-muted-foreground">Ready</span>
				</div>
				<div class="flex items-center gap-1">
					<Badge variant="secondary">{doingCount}</Badge>
					<span class="text-muted-foreground">Doing</span>
				</div>
				<div class="flex items-center gap-1">
					<Badge variant="destructive">{blockedCount}</Badge>
					<span class="text-muted-foreground">Blocked</span>
				</div>
			</div>
		</CardContent>
	</Card>
</a>

<!-- TODO: Implement count calculations from loaded data -->
<!-- TODO: Add loading skeleton state -->
