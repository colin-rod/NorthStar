<script lang="ts">
	/**
	 * IssueSheet Component
	 *
	 * Bottom sheet/drawer for editing issue details.
	 * Mobile-first design pattern.
	 *
	 * Requirements from CLAUDE.md:
	 * - Editable fields: title, status, priority, story_points, epic, milestone
	 * - Inline dependency display (Blocked by / Blocking)
	 * - Collapsible sub-issues list
	 * - Form actions for mutations
	 */

	import type { Issue } from '$lib/types';
	import { Sheet, SheetContent, SheetHeader, SheetTitle } from '$lib/components/ui/sheet';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';

	export let open = false;
	export let issue: Issue | null = null;

	// TODO: Add Select components for epic, status, priority
	// TODO: Add dependency management UI
	// TODO: Add sub-issues collapsible list
	// TODO: Implement form submission with SvelteKit actions
</script>

<Sheet bind:open>
	<SheetContent side="bottom" class="h-[90vh]">
		{#if issue}
			<SheetHeader>
				<SheetTitle>Edit Issue</SheetTitle>
			</SheetHeader>

			<form method="POST" action="?/updateIssue" class="space-y-4 mt-4">
				<input type="hidden" name="id" value={issue.id} />

				<!-- Title -->
				<div>
					<Label for="title">Title</Label>
					<Input id="title" name="title" value={issue.title} required />
				</div>

				<!-- TODO: Add Status Select -->
				<!-- TODO: Add Priority Select -->
				<!-- TODO: Add Epic Select -->
				<!-- TODO: Add Story Points Input (1, 2, 3, 5, 8, 13, 21) -->
				<!-- TODO: Add Milestone Select -->

				<!-- TODO: Dependencies Section -->
				<div class="border-t pt-4">
					<h3 class="font-medium mb-2">Dependencies</h3>
					<!-- Blocked by: list -->
					<!-- Blocking: list -->
					<!-- Add dependency button -->
				</div>

				<!-- TODO: Sub-issues Section -->
				<div class="border-t pt-4">
					<h3 class="font-medium mb-2">Sub-issues</h3>
					<!-- Collapsible list of sub-issues -->
					<!-- Add sub-issue button -->
				</div>

				<div class="flex gap-2">
					<Button type="submit">Save</Button>
					<Button type="button" variant="outline" on:click={() => open = false}>
						Cancel
					</Button>
				</div>
			</form>
		{/if}
	</SheetContent>
</Sheet>

<!-- TODO: Add form validation -->
<!-- TODO: Add loading states -->
<!-- TODO: Add error handling -->
