<script lang="ts">
	/**
	 * Project Detail Page
	 *
	 * Shows a project with its epics and counts.
	 *
	 * Requirements from CLAUDE.md:
	 * - Epics list with counts (Ready, Blocked, Doing)
	 */

	import type { PageData } from './$types';
	import EpicCard from '$lib/components/EpicCard.svelte';
	import { Button } from '$lib/components/ui/button';

	export let data: PageData;
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">{data.project?.name || 'Project'}</h1>
			<p class="text-muted-foreground">
				{data.epics?.length || 0} epics
			</p>
		</div>
		<Button>New Epic</Button>
	</div>

	<!-- Epics Grid -->
	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#if data.epics && data.epics.length > 0}
			{#each data.epics as epic (epic.id)}
				<EpicCard {epic} />
			{/each}
		{:else}
			<p class="col-span-full text-center text-muted-foreground py-8">
				No epics in this project
			</p>
		{/if}
	</div>
</div>

<!-- TODO: Add project settings -->
<!-- TODO: Add project statistics -->
<!-- TODO: Add create epic form -->
