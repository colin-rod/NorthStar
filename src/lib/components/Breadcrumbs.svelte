<script lang="ts">
  /**
   * Breadcrumbs Component - North Design System
   *
   * Navigation breadcrumbs for desktop showing current context.
   * Only visible on desktop (≥768px).
   *
   * North Design Principles:
   * - text-metadata (13px), muted color
   * - Separator: →
   * - Current page in primary color
   * - Clean, minimal appearance
   *
   * Usage:
   * ```svelte
   * <Breadcrumbs items={[
   *   { label: 'Projects', href: '/projects' },
   *   { label: 'My Project', href: '/projects/123' },
   *   { label: 'Epic Name', href: '/epics/456', current: true }
   * ]} />
   * ```
   */

  export interface BreadcrumbItem {
    label: string;
    href: string;
    current?: boolean;
  }

  interface Props {
    items: BreadcrumbItem[];
  }

  let { items }: Props = $props();
</script>

{#if items.length > 0}
  <nav aria-label="Breadcrumb" class="flex items-center gap-2">
    {#each items as item, index (item.href)}
      {#if index > 0}
        <span class="text-metadata text-foreground-muted" aria-hidden="true">→</span>
      {/if}

      {#if item.current}
        <span class="text-metadata text-primary font-medium" aria-current="page">
          {item.label}
        </span>
      {:else}
        <a
          href={item.href}
          class="text-metadata text-foreground-muted hover:text-foreground transition-colors"
        >
          {item.label}
        </a>
      {/if}
    {/each}
  </nav>
{/if}
