<script lang="ts" module>
  import { tv, type VariantProps } from 'tailwind-variants';

  /* North Design System: White surface, soft shadow, rounded top corners, 200-250ms slide-up */
  export const sheetVariants = tv({
    base: 'bg-surface data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-6 shadow-level-2 transition-transform ease-out data-[state=closed]:duration-200 data-[state=open]:duration-250',
    variants: {
      side: {
        top: 'data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b border-border rounded-b-lg',
        /* Bottom: Mobile-first drawer with 20px top radius per North spec */
        bottom:
          'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t border-border rounded-t-[20px]',
        left: 'data-[state=closed]:slide-out-to-start data-[state=open]:slide-in-from-start inset-y-0 start-0 h-full w-3/4 border-e border-border sm:max-w-sm rounded-e-lg',
        right:
          'data-[state=closed]:slide-out-to-end data-[state=open]:slide-in-from-end inset-y-0 end-0 h-full w-full border-s border-border sm:max-w-[600px] rounded-s-lg',
      },
    },
    defaultVariants: {
      side: 'bottom' /* Mobile-first: default to bottom drawer */,
    },
  });

  export type Side = VariantProps<typeof sheetVariants>['side'];
</script>

<script lang="ts">
  import { Dialog as SheetPrimitive } from 'bits-ui';
  import XIcon from '@lucide/svelte/icons/x';
  import type { Snippet } from 'svelte';
  import SheetPortal from './sheet-portal.svelte';
  import SheetOverlay from './sheet-overlay.svelte';
  import { cn, type WithoutChildrenOrChild } from '$lib/utils.js';
  import type { ComponentProps } from 'svelte';

  let {
    ref = $bindable(null),
    class: className,
    side = 'bottom',
    portalProps,
    children,
    ...restProps
  }: WithoutChildrenOrChild<SheetPrimitive.ContentProps> & {
    portalProps?: WithoutChildrenOrChild<ComponentProps<typeof SheetPortal>>;
    side?: Side;
    children: Snippet;
  } = $props();
</script>

<SheetPortal {...portalProps}>
  <SheetOverlay />
  <SheetPrimitive.Content
    bind:ref
    data-slot="sheet-content"
    class={cn(sheetVariants({ side }), className)}
    {...restProps}
  >
    {@render children?.()}
    <!-- North Design: Subtle close button -->
    <SheetPrimitive.Close
      class="absolute end-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none text-foreground-muted hover:text-foreground"
    >
      <XIcon class="size-5" />
      <span class="sr-only">Close</span>
    </SheetPrimitive.Close>
  </SheetPrimitive.Content>
</SheetPortal>
