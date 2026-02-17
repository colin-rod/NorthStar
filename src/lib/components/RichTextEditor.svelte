<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Editor } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import Link from '@tiptap/extension-link';
  import Image from '@tiptap/extension-image';
  import Placeholder from '@tiptap/extension-placeholder';

  interface Props {
    content: string | null;
    onchange: (html: string) => void;
    disabled?: boolean;
    placeholder?: string;
    uploadImage?: (file: File) => Promise<string>;
  }

  let {
    content,
    onchange,
    disabled = false,
    placeholder = 'Add a description...',
    uploadImage,
  }: Props = $props();

  let editorElement = $state<HTMLDivElement | null>(null);
  let editor = $state<Editor | null>(null);
  let isUpdatingFromProp = false;

  $effect(() => {
    if (!editorElement) return;

    const instance = new Editor({
      element: editorElement,
      extensions: [
        StarterKit,
        Link.configure({ openOnClick: false }),
        Image,
        Placeholder.configure({ placeholder }),
      ],
      content: content ?? '',
      editable: !disabled,
      onUpdate: ({ editor: e }) => {
        if (!isUpdatingFromProp) {
          onchange(e.getHTML());
        }
      },
    });

    editor = instance;

    return () => {
      instance.destroy();
      editor = null;
    };
  });

  // Sync content prop changes (e.g., when a different issue is opened)
  $effect(() => {
    if (editor && content !== null && content !== editor.getHTML()) {
      isUpdatingFromProp = true;
      editor.commands.setContent(content ?? '');
      isUpdatingFromProp = false;
    }
  });

  // Sync disabled state changes
  $effect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  });

  function handleSetLink() {
    const url = window.prompt('Enter URL');
    if (url === null) return;
    if (url === '') {
      editor?.chain().focus().unsetLink().run();
    } else {
      editor?.chain().focus().setLink({ href: url }).run();
    }
  }

  async function handleImageUpload(event: Event) {
    if (!uploadImage) return;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const url = await uploadImage(file);
      editor?.chain().focus().setImage({ src: url }).run();
    } finally {
      input.value = '';
    }
  }

  onDestroy(() => {
    editor?.destroy();
  });
</script>

<div class="rich-text-editor border border-border rounded-md overflow-hidden">
  <!-- Toolbar -->
  <div class="toolbar border-b border-border p-1.5 flex gap-0.5 flex-wrap bg-muted/30">
    <button
      type="button"
      title="Bold"
      onclick={() => editor?.chain().focus().toggleBold().run()}
      {disabled}
      class="toolbar-btn"
      class:is-active={editor?.isActive('bold')}
    >
      <strong>B</strong>
    </button>
    <button
      type="button"
      title="Italic"
      onclick={() => editor?.chain().focus().toggleItalic().run()}
      {disabled}
      class="toolbar-btn"
      class:is-active={editor?.isActive('italic')}
    >
      <em>I</em>
    </button>
    <div class="w-px bg-border mx-0.5 self-stretch"></div>
    <button
      type="button"
      title="Bullet list"
      onclick={() => editor?.chain().focus().toggleBulletList().run()}
      {disabled}
      class="toolbar-btn"
      class:is-active={editor?.isActive('bulletList')}
    >
      ≡
    </button>
    <button
      type="button"
      title="Ordered list"
      onclick={() => editor?.chain().focus().toggleOrderedList().run()}
      {disabled}
      class="toolbar-btn"
      class:is-active={editor?.isActive('orderedList')}
    >
      №
    </button>
    <div class="w-px bg-border mx-0.5 self-stretch"></div>
    <button
      type="button"
      title="Link"
      onclick={handleSetLink}
      {disabled}
      class="toolbar-btn"
      class:is-active={editor?.isActive('link')}
    >
      🔗
    </button>
    {#if uploadImage}
      <label class="toolbar-btn cursor-pointer" title="Insert image" class:opacity-50={disabled}>
        🖼
        <input
          type="file"
          accept="image/*"
          onchange={handleImageUpload}
          {disabled}
          class="sr-only"
        />
      </label>
    {/if}
  </div>

  <!-- Editor content -->
  <div
    bind:this={editorElement}
    class="editor-content p-3 min-h-24 focus-within:outline-none"
  ></div>
</div>

<style>
  .toolbar-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 4px;
    font-size: 13px;
    color: var(--color-foreground-muted, #6b7280);
    background: transparent;
    border: none;
    cursor: pointer;
    transition:
      background 0.1s,
      color 0.1s;
  }

  .toolbar-btn:hover:not(:disabled) {
    background: var(--color-muted, #f3f4f6);
    color: var(--color-foreground, #111827);
  }

  .toolbar-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .toolbar-btn.is-active {
    background: var(--color-primary, #3b82f6);
    color: white;
  }

  /* Tiptap / ProseMirror content styles */
  .editor-content :global(.ProseMirror) {
    outline: none;
    min-height: 80px;
  }

  .editor-content :global(.ProseMirror p) {
    margin: 0 0 0.5em;
  }

  .editor-content :global(.ProseMirror p:last-child) {
    margin-bottom: 0;
  }

  .editor-content :global(.ProseMirror ul),
  .editor-content :global(.ProseMirror ol) {
    padding-left: 1.5em;
    margin: 0.5em 0;
  }

  .editor-content :global(.ProseMirror li) {
    margin-bottom: 0.25em;
  }

  .editor-content :global(.ProseMirror strong) {
    font-weight: 600;
  }

  .editor-content :global(.ProseMirror em) {
    font-style: italic;
  }

  .editor-content :global(.ProseMirror a) {
    color: var(--color-primary, #3b82f6);
    text-decoration: underline;
    cursor: pointer;
  }

  .editor-content :global(.ProseMirror img) {
    max-width: 100%;
    border-radius: 4px;
    margin: 0.5em 0;
  }

  .editor-content :global(.ProseMirror h1) {
    font-size: 1.5em;
    font-weight: 700;
    margin: 0.75em 0 0.5em;
  }

  .editor-content :global(.ProseMirror h2) {
    font-size: 1.25em;
    font-weight: 600;
    margin: 0.75em 0 0.5em;
  }

  .editor-content :global(.ProseMirror h3) {
    font-size: 1.1em;
    font-weight: 600;
    margin: 0.75em 0 0.5em;
  }

  /* Placeholder */
  .editor-content :global(.ProseMirror p.is-editor-empty:first-child::before) {
    content: attr(data-placeholder);
    float: left;
    color: var(--color-foreground-muted, #9ca3af);
    pointer-events: none;
    height: 0;
  }
</style>
