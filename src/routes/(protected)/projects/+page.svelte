<script lang="ts">
	/**
	 * Projects List Page
	 *
	 * Shows all user's projects in a grid layout
	 */

	import ProjectCard from '$lib/components/ProjectCard.svelte';
	import Button from '$lib/components/ui/button.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-3xl font-bold">Projects</h1>
		<Button disabled>New Project</Button>
	</div>

	{#if data.projects.length === 0}
		<div class="text-center py-12">
			<p class="text-muted-foreground text-lg">No projects yet. Create your first project.</p>
		</div>
	{:else}
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each data.projects as project}
				<ProjectCard {project} />
			{/each}
		</div>
	{/if}
</div>
