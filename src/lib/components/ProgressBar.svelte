<script lang="ts">
  interface Props {
    percentage: number;
    label?: boolean;
    ariaLabel?: string;
  }

  let { percentage, label = true, ariaLabel = 'Completion progress' }: Props = $props();

  let clamped = $derived(Math.max(0, Math.min(100, Number(percentage) || 0)));
  let fillClass = $derived(
    clamped === 100
      ? 'bg-progress-done'
      : clamped >= 75
        ? 'bg-progress-high'
        : clamped >= 50
          ? 'bg-progress-mid'
          : clamped >= 25
            ? 'bg-progress-low'
            : 'bg-progress-critical',
  );
</script>

<div class="flex items-center gap-2">
  <div
    class="flex-1 h-[3px] bg-muted rounded-full overflow-hidden"
    role="progressbar"
    aria-valuemin="0"
    aria-valuemax="100"
    aria-valuenow={clamped}
    aria-label={ariaLabel}
  >
    <div
      class="h-full {fillClass} rounded-full transition-all duration-300"
      style="width: {clamped}%"
    ></div>
  </div>
  {#if label}
    <span class="text-metadata text-foreground-secondary shrink-0">{percentage}%</span>
  {/if}
</div>
