<script lang="ts">
  import type { Component } from 'svelte';

  interface Props {
    icon: Component;
    title: string;
    description: string;
    ctaLabel?: string;
    onCtaClick?: () => void;
    variant?: 'default' | 'positive' | 'subtle';
  }

  let {
    icon: Icon,
    title,
    description,
    ctaLabel,
    onCtaClick,
    variant = 'default',
  }: Props = $props();
</script>

<div class="text-center {variant === 'subtle' ? 'py-8' : 'py-12'}">
  <div class="flex flex-col items-center gap-3">
    <div
      class="rounded-full p-3 {variant === 'positive'
        ? 'bg-emerald-500/10 text-emerald-500'
        : 'bg-muted text-muted-foreground'}"
    >
      <Icon class="h-6 w-6" />
    </div>
    <div class="space-y-1">
      <p
        class="{variant === 'subtle' ? 'text-metadata' : 'text-base'} font-medium {variant ===
        'positive'
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-foreground'}"
      >
        {title}
      </p>
      <p class="{variant === 'subtle' ? 'text-metadata' : 'text-sm'} text-muted-foreground">
        {description}
      </p>
    </div>
    {#if ctaLabel && onCtaClick}
      <button
        type="button"
        onclick={onCtaClick}
        class="mt-2 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-white hover:bg-primary-hover h-9 px-4"
      >
        {ctaLabel}
      </button>
    {/if}
  </div>
</div>
