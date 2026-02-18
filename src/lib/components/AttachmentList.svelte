<script lang="ts">
  import type { Attachment } from '$lib/types';
  import { supabase } from '$lib/supabase';
  import { formatFileSize } from '$lib/utils/attachment-helpers';

  interface Props {
    attachments: Attachment[];
    onUpload: (file: File) => Promise<void>;
    onDelete: (attachment: Attachment) => Promise<void>;
    disabled?: boolean;
  }

  let { attachments, onUpload, onDelete, disabled = false }: Props = $props();

  let uploading = $state(false);
  let signedUrls = $state<Record<string, string>>({});

  // Generate signed URLs for private attachments
  $effect(() => {
    for (const att of attachments) {
      if (!signedUrls[att.id]) {
        supabase.storage
          .from('attachments')
          .createSignedUrl(att.storage_path, 3600)
          .then(({ data }) => {
            if (data?.signedUrl) {
              signedUrls = { ...signedUrls, [att.id]: data.signedUrl };
            }
          });
      }
    }
  });

  async function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    uploading = true;
    try {
      await onUpload(file);
    } finally {
      uploading = false;
      input.value = '';
    }
  }
</script>

<div class="space-y-1.5">
  {#each attachments as attachment (attachment.id)}
    <div class="flex items-center justify-between gap-2 py-1.5 px-2 rounded-md bg-muted/40 text-sm">
      <a
        href={signedUrls[attachment.id] ?? '#'}
        target="_blank"
        rel="noopener noreferrer"
        class="truncate text-primary hover:underline min-w-0"
      >
        {attachment.file_name}
        <span class="text-xs text-foreground-muted ml-1"
          >({formatFileSize(attachment.file_size)})</span
        >
      </a>
      {#if !disabled}
        <button
          type="button"
          onclick={() => onDelete(attachment)}
          class="text-xs text-destructive hover:text-destructive/80 shrink-0 whitespace-nowrap"
        >
          Remove
        </button>
      {/if}
    </div>
  {/each}

  {#if !disabled}
    <label class="flex items-center gap-1.5 cursor-pointer mt-1">
      <span class="text-sm text-primary hover:underline">
        {uploading ? 'Uploading...' : 'Add attachment'}
      </span>
      <input
        type="file"
        onchange={handleFileSelect}
        disabled={uploading || disabled}
        class="sr-only"
      />
    </label>
  {/if}
</div>
