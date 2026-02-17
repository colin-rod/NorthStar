<script lang="ts">
  import { Collapsible as CollapsiblePrimitive } from 'bits-ui';
  import { cn } from '$lib/utils.js';

  type $$Props = CollapsiblePrimitive.ContentProps;

  let { children, class: className, ...restProps }: $$Props = $props();
</script>

<CollapsiblePrimitive.Content
  class={cn('overflow-hidden transition-all', className)}
  {...restProps}
>
  {@render children?.()}
</CollapsiblePrimitive.Content>
