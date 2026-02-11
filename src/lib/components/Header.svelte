<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/button.svelte';
	import type { Session } from '@supabase/supabase-js';

	let { session }: { session: Session | null } = $props();

	let loggingOut = $state(false);
</script>

<header class="border-b">
	<div class="container mx-auto flex items-center justify-between px-4 py-3">
		<a href="/" class="text-xl font-bold">Issue Tracker</a>

		{#if session}
			<div class="flex items-center gap-4">
				<span class="text-sm text-muted-foreground hidden sm:inline">
					{session.user.email}
				</span>

				<form
					method="POST"
					action="/?/logout"
					use:enhance={() => {
						loggingOut = true;
						return async ({ update }) => {
							await update();
							loggingOut = false;
						};
					}}
				>
					<Button type="submit" variant="outline" size="sm" disabled={loggingOut}>
						{loggingOut ? 'Logging out...' : 'Logout'}
					</Button>
				</form>
			</div>
		{/if}
	</div>
</header>
