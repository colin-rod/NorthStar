<script lang="ts">
  import { Collapsible as CollapsiblePrimitive } from 'bits-ui';

  interface Props {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    disabled?: boolean;
    children?: import('svelte').Snippet;
    [key: string]: any;
  }

  let { open = $bindable(false), onOpenChange, disabled, children, ...restProps }: Props = $props();
</script>

<CollapsiblePrimitive.Root bind:open {onOpenChange} {disabled} {...restProps}>
  {@render children?.()}
</CollapsiblePrimitive.Root>
