<script lang="ts">
	import { cn } from '$lib/utils';
	import { getContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		class: className,
		value,
		children,
		...props
	}: { class?: string; value: string; children?: Snippet } & HTMLAttributes<HTMLDivElement> =
		$props();

	const ctx = getContext<{ activeTab: () => string }>('tabs');
	const isActive = $derived(ctx.activeTab() === value);
</script>

{#if isActive}
	<div
		class={cn(
			'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
			className
		)}
		{...props}
	>
		{#if children}
			{@render children()}
		{/if}
	</div>
{/if}
