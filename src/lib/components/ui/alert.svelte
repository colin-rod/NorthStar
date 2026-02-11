<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		class: className,
		variant = 'default',
		children,
		...props
	}: {
		class?: string;
		variant?: 'default' | 'destructive';
		children?: Snippet;
	} & HTMLAttributes<HTMLDivElement> = $props();

	const variantClasses = {
		default: 'bg-background text-foreground',
		destructive:
			'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive'
	};
</script>

<div
	class={cn(
		'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
		variantClasses[variant],
		className
	)}
	{...props}
>
	{#if children}
		{@render children()}
	{/if}
</div>
