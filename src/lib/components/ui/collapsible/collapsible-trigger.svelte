<script lang="ts">
  import { Collapsible as CollapsiblePrimitive } from 'bits-ui';

  type $$Props = CollapsiblePrimitive.TriggerProps;

  let { children, ...restProps }: $$Props = $props();
</script>

<CollapsiblePrimitive.Trigger {...restProps}>
  {@render children?.()}
</CollapsiblePrimitive.Trigger>
