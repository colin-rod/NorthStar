<script lang="ts" module>
	import { type VariantProps, tv } from 'tailwind-variants';

	/* North Design System Badge Variants */
	export const badgeVariants = tv({
		base: 'inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-[6px] border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-colors [&>svg]:pointer-events-none [&>svg]:size-3',
		variants: {
			variant: {
				/* Default: Primary burnt orange tint */
				default: 'bg-primary-tint text-primary border-transparent',
				/* Secondary: Subtle neutral */
				secondary: 'bg-surface-subtle text-foreground-secondary border-transparent',
				/* Destructive: Red text only, no filled background per North spec */
				destructive:
					'bg-transparent text-destructive border-transparent hover:bg-destructive/10',
				/* Outline: Subtle border with no background */
				outline: 'text-foreground border-border bg-transparent hover:bg-surface-subtle',
				/* Status variants - muted, not loud per North spec */
				'status-todo': 'bg-surface-subtle text-foreground-muted border-transparent',
				'status-doing': 'bg-status-doing/10 text-status-doing border-transparent',
				'status-in-review': 'bg-status-in-review/10 text-status-in-review border-transparent',
				'status-done': 'bg-bg-done text-status-done border-transparent',
				'status-blocked': 'bg-bg-blocked text-status-blocked border-transparent',
				'status-canceled': 'bg-surface-subtle text-foreground-muted border-transparent'
			}
		},
		defaultVariants: {
			variant: 'default'
		}
	});

	export type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];
</script>

<script lang="ts">
	import type { HTMLAnchorAttributes } from 'svelte/elements';
	import { cn, type WithElementRef } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		href,
		class: className,
		variant = 'default',
		children,
		...restProps
	}: WithElementRef<HTMLAnchorAttributes> & {
		variant?: BadgeVariant;
	} = $props();
</script>

<svelte:element
	this={href ? 'a' : 'span'}
	bind:this={ref}
	data-slot="badge"
	{href}
	class={cn(badgeVariants({ variant }), className)}
	{...restProps}
>
	{@render children?.()}
</svelte:element>
