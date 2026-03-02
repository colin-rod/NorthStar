<script lang="ts">
  import type { Component } from 'svelte';
  import { Button } from '$lib/components/ui/button';

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
        ? 'bg-bg-done text-status-done'
        : 'bg-muted text-muted-foreground'}"
    >
      <Icon class="h-6 w-6" />
    </div>
    <div class="space-y-1">
      <p
        class="{variant === 'subtle' ? 'text-metadata' : 'text-base'} font-medium {variant ===
        'positive'
          ? 'text-status-done'
          : 'text-foreground'}"
      >
        {title}
      </p>
      <p class="{variant === 'subtle' ? 'text-metadata' : 'text-sm'} text-muted-foreground">
        {description}
      </p>
    </div>
    {#if ctaLabel && onCtaClick}
      <Button size="sm" class="mt-2" onclick={onCtaClick}>
        {ctaLabel}
      </Button>
    {/if}
  </div>
</div>
