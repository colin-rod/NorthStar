<script lang="ts">
	/**
	 * Settings Page
	 *
	 * User profile, account settings, and placeholder sections
	 */

	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/button.svelte';
	import { Card, CardHeader, CardContent } from '$lib/components/ui/card';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let loggingOut = $state(false);
</script>

<div class="space-y-6">
	<h1 class="text-3xl font-bold">Settings</h1>

	<!-- Profile Section -->
	<Card>
		<CardHeader>
			<h2 class="text-xl font-semibold">Profile</h2>
		</CardHeader>
		<CardContent class="space-y-4">
			<div>
				<p class="text-sm text-muted-foreground">Signed in as</p>
				<p class="text-lg font-medium">{data.session?.user.email}</p>
			</div>
		</CardContent>
	</Card>

	<!-- Account Section -->
	<Card>
		<CardHeader>
			<h2 class="text-xl font-semibold">Account</h2>
		</CardHeader>
		<CardContent>
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
				<Button type="submit" variant="destructive" disabled={loggingOut}>
					{loggingOut ? 'Logging out...' : 'Logout'}
				</Button>
			</form>
		</CardContent>
	</Card>

	<!-- Theme Section (Placeholder) -->
	<Card>
		<CardHeader>
			<h2 class="text-xl font-semibold">Theme</h2>
		</CardHeader>
		<CardContent>
			<p class="text-muted-foreground">Coming soon</p>
		</CardContent>
	</Card>

	<!-- Notifications Section (Placeholder) -->
	<Card>
		<CardHeader>
			<h2 class="text-xl font-semibold">Notifications</h2>
		</CardHeader>
		<CardContent>
			<p class="text-muted-foreground">Coming soon</p>
		</CardContent>
	</Card>

	<!-- Data & Privacy Section (Placeholder) -->
	<Card>
		<CardHeader>
			<h2 class="text-xl font-semibold">Data & Privacy</h2>
		</CardHeader>
		<CardContent>
			<p class="text-muted-foreground">Coming soon</p>
		</CardContent>
	</Card>
</div>
