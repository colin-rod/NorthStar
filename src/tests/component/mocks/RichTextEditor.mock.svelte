<script lang="ts">
  let {
    content = null,
    onchange,
    disabled = false,
  }: {
    content: string | null;
    onchange: (html: string) => void;
    disabled?: boolean;
  } = $props();
</script>

<div data-testid="rich-text-editor-mock">
  <button
    type="button"
    data-testid="emit-description-same"
    onclick={() => onchange(content ?? '')}
    {disabled}
  >
    Emit Same
  </button>

  <button
    type="button"
    data-testid="emit-description-updated"
    onclick={() => onchange('<p>updated description</p>')}
    {disabled}
  >
    Emit Updated
  </button>
</div>
