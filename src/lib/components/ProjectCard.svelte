<script lang="ts">
	/**
	 * ProjectCard Component - North Design System
	 *
	 * Displays a project card with epic counts.
	 * Used in: Projects list view
	 *
	 * North Design Principles:
	 * - 10px border radius for cards
	 * - Subtle border, no heavy shadows
	 * - Minimal hover states
	 * - Clean typography hierarchy
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

<!-- North Design: Card with 10px radius, subtle border, minimal hover -->
<a href="/projects/{project.id}" class="block">
	<Card
		class="hover:shadow-level-1 transition-shadow duration-150 cursor-pointer border-border rounded-md"
	>
		<CardHeader class="pb-4">
			<!-- Project name: section header weight -->
			<h3 class="text-section-header font-ui">{project.name}</h3>
		</CardHeader>
		<CardContent>
			<!-- Counts with subtle badges -->
			<div class="flex gap-4 text-metadata">
				<div class="flex items-center gap-2">
					<Badge variant="default" class="text-xs">{readyCount}</Badge>
					<span class="text-foreground-secondary">Ready</span>
				</div>
				<div class="flex items-center gap-2">
					<Badge variant="status-doing" class="text-xs">{doingCount}</Badge>
					<span class="text-foreground-secondary">Doing</span>
				</div>
				<div class="flex items-center gap-2">
					<Badge variant="status-blocked" class="text-xs">{blockedCount}</Badge>
					<span class="text-foreground-secondary">Blocked</span>
				</div>
			</div>
		</CardContent>
	</Card>
</a>

<!-- TODO: Implement count calculations from loaded data -->
<!-- TODO: Add loading skeleton state -->
