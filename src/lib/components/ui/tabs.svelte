<script lang="ts">
	import { cn } from '$lib/utils';
	import { setContext, getContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		class: className,
		defaultValue,
		children,
		...props
	}: {
		class?: string;
		defaultValue?: string;
		children?: Snippet;
	} & HTMLAttributes<HTMLDivElement> = $props();

	let activeTab = $state(defaultValue || '');
	setContext('tabs', {
		get activeTab() {
			return activeTab;
		},
		setTab: (tab: string) => (activeTab = tab)
	});
</script>

<div class={cn('w-full', className)} {...props}>
	{#if children}
		{@render children()}
	{/if}
</div>
