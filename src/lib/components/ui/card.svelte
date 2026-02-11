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

<div class={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)} {...props}>
	{#if children}
		{@render children()}
	{/if}
</div>
