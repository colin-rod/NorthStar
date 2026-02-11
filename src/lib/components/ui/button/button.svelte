<script lang="ts">
  import { cn } from '$lib/utils';
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  let {
    class: className,
    variant = 'default',
    size = 'default',
    children,
    ...props
  }: {
    class?: string;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    children?: Snippet;
  } & HTMLButtonAttributes = $props();

  /* North Design System Button Variants */
  const variantClasses = {
    /* Primary: Burnt orange background, white text, 8px radius */
    default:
      'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-hover shadow-level-1',
    /* Destructive: Red text only (no filled background per North spec) */
    destructive:
      'text-destructive hover:bg-destructive/10 active:bg-destructive/15 border border-transparent',
    /* Secondary: Transparent with subtle border */
    secondary:
      'border border-border bg-transparent hover:bg-surface-subtle active:bg-muted text-foreground',
    /* Outline: Similar to secondary but with more emphasis */
    outline:
      'border border-input bg-transparent hover:bg-surface-subtle hover:text-foreground text-foreground',
    /* Ghost: No border, subtle hover */
    ghost: 'hover:bg-surface-subtle hover:text-foreground text-foreground',
    /* Link: Text-only with underline on hover */
    link: 'text-primary underline-offset-4 hover:underline',
  };

  const sizeClasses = {
    /* Default: 12px horizontal padding per spec, maintain vertical for touch targets */
    default: 'h-10 px-4 py-2',
    sm: 'h-9 px-3 py-1.5 text-sm',
    lg: 'h-11 px-4 py-2.5',
    icon: 'h-10 w-10 p-0',
  };
</script>

<button
  class={cn(
    /* Base styles - 8px border radius per North spec */
    'inline-flex items-center justify-center rounded-[8px] text-[15px] font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    variantClasses[variant],
    sizeClasses[size],
    className,
  )}
  {...props}
>
  {#if children}
    {@render children()}
  {/if}
</button>
