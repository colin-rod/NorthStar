<script lang="ts">
  import { getStatusDotClass, formatStatus } from '$lib/utils/design-tokens';

  interface Props {
    status: string;
    class?: string;
  }

  let { status, class: className = '' }: Props = $props();
</script>

<div
  class="w-2 h-2 md:w-3 md:h-3 rounded-full transition-colors duration-300 {getStatusDotClass(
    status,
  )} {className}"
  aria-hidden="true"
></div>
<span class="sr-only">{formatStatus(status)}</span>
