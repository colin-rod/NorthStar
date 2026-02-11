<script lang="ts">
	import { cn } from '$lib/utils';
	import { getContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	let {
		class: className,
		value,
		children,
		...props
	}: { class?: string; value: string; children?: Snippet } & HTMLButtonAttributes = $props();

	const ctx = getContext<{ activeTab: () => string; setTab: (tab: string) => void }>('tabs');
	const isActive = $derived(ctx.activeTab() === value);
</script>

<button
	type="button"
	class={cn(
		'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
		isActive && 'bg-background text-foreground shadow-sm',
		className
	)}
	onclick={() => ctx.setTab(value)}
	{...props}
>
	{#if children}
		{@render children()}
	{/if}
</button>
