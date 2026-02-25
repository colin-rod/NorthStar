<script lang="ts">
  let {
    onShowToast = (_message: string, _type: 'success' | 'error') => {},
  }: {
    onShowToast?: (message: string, type: 'success' | 'error') => void;
  } = $props();
</script>

<button type="button" onclick={() => onShowToast('Saved from grid', 'success')}>Emit success</button>
<button type="button" onclick={() => onShowToast('Failed from grid', 'error')}>Emit error</button>
