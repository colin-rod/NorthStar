<script lang="ts">
  import type { Link } from '$lib/types';
  import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
  import { Input } from '$lib/components/ui/input';

  interface Props {
    links: Link[];
    onAdd: (url: string, label: string) => Promise<void>;
    onDelete: (link: Link) => Promise<void>;
    disabled?: boolean;
  }

  let { links, onAdd, onDelete, disabled = false }: Props = $props();

  let popoverOpen = $state(false);
  let inputLabel = $state('');
  let inputUrl = $state('');
  let adding = $state(false);
  let urlError = $state('');

  async function handleAdd() {
    const url = inputUrl.trim();
    if (!url) return;

    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        urlError = 'URL must start with http:// or https://';
        return;
      }
    } catch {
      urlError = 'Please enter a valid URL';
      return;
    }
    urlError = '';

    const label = inputLabel.trim() || url;
    adding = true;
    try {
      await onAdd(url, label);
      inputLabel = '';
      inputUrl = '';
      popoverOpen = false;
    } finally {
      adding = false;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAdd();
    } else if (event.key === 'Escape') {
      popoverOpen = false;
    }
  }
</script>

<div class="space-y-1.5">
  {#each links as link (link.id)}
    <div class="flex items-center justify-between gap-2 py-1.5 px-2 rounded-md bg-muted/40 text-sm">
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        class="truncate text-primary hover:underline min-w-0"
      >
        {link.label}
      </a>
      {#if !disabled}
        <button
          type="button"
          onclick={() => onDelete(link)}
          class="text-xs text-destructive hover:text-destructive/80 shrink-0 whitespace-nowrap"
        >
          Remove
        </button>
      {/if}
    </div>
  {/each}

  {#if !disabled}
    <Popover bind:open={popoverOpen}>
      <PopoverTrigger>
        <span
          class="flex items-center gap-1.5 cursor-pointer mt-1 text-sm text-primary hover:underline"
        >
          Add link
        </span>
      </PopoverTrigger>
      <PopoverContent class="w-72 p-3" align="start">
        <div class="space-y-2">
          <div>
            <label for="link-label" class="text-xs text-foreground-muted mb-1 block"
              >Display name</label
            >
            <Input
              id="link-label"
              value={inputLabel}
              oninput={(e: Event) => (inputLabel = (e.target as HTMLInputElement).value)}
              placeholder="e.g. GitHub PR"
              onkeydown={handleKeydown}
              class="h-8 text-sm"
            />
          </div>
          <div>
            <label for="link-url" class="text-xs text-foreground-muted mb-1 block">URL</label>
            <Input
              id="link-url"
              value={inputUrl}
              oninput={(e: Event) => (inputUrl = (e.target as HTMLInputElement).value)}
              placeholder="https://"
              onkeydown={handleKeydown}
              class="h-8 text-sm"
            />
            {#if urlError}
              <p class="text-xs text-destructive mt-1">{urlError}</p>
            {/if}
          </div>
          <div class="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onclick={() => {
                popoverOpen = false;
                inputLabel = '';
                inputUrl = '';
                urlError = '';
              }}
              class="text-xs text-foreground-muted hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onclick={handleAdd}
              disabled={adding || !inputUrl.trim()}
              class="text-xs text-primary hover:text-primary/80 disabled:opacity-40"
            >
              {adding ? 'Adding...' : 'Add'}
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  {/if}
</div>
