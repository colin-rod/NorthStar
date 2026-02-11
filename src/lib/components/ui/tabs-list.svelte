<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		class: className,
		children,
		...props
	}: { class?: string; children?: Snippet } & HTMLAttributes<HTMLDivElement> = $props();
</script>

<div
	class={cn(
		'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
		className
	)}
	{...props}
>
	{#if children}
		{@render children()}
	{/if}
</div>
