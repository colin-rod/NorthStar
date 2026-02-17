/**
 * TDD Tests for RichTextEditor component
 * RED phase: These tests will fail until the component is implemented
 */
import { render, screen } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';

import RichTextEditor from '$lib/components/RichTextEditor.svelte';

describe('RichTextEditor', () => {
  it('renders without crashing when content is null', () => {
    expect(() => {
      render(RichTextEditor, {
        props: { content: null, onchange: vi.fn() },
      });
    }).not.toThrow();
  });

  it('renders the editor container', () => {
    render(RichTextEditor, {
      props: { content: null, onchange: vi.fn() },
    });
    const editor = document.querySelector('.rich-text-editor');
    expect(editor).not.toBeNull();
  });

  it('renders toolbar with Bold button', () => {
    render(RichTextEditor, {
      props: { content: null, onchange: vi.fn() },
    });
    expect(screen.getByTitle('Bold')).toBeTruthy();
  });

  it('renders toolbar with Italic button', () => {
    render(RichTextEditor, {
      props: { content: null, onchange: vi.fn() },
    });
    expect(screen.getByTitle('Italic')).toBeTruthy();
  });

  it('renders toolbar with Bullet list button', () => {
    render(RichTextEditor, {
      props: { content: null, onchange: vi.fn() },
    });
    expect(screen.getByTitle('Bullet list')).toBeTruthy();
  });

  it('renders toolbar with Ordered list button', () => {
    render(RichTextEditor, {
      props: { content: null, onchange: vi.fn() },
    });
    expect(screen.getByTitle('Ordered list')).toBeTruthy();
  });

  it('renders toolbar with Link button', () => {
    render(RichTextEditor, {
      props: { content: null, onchange: vi.fn() },
    });
    expect(screen.getByTitle('Link')).toBeTruthy();
  });

  it('toolbar buttons are disabled when disabled prop is true', () => {
    render(RichTextEditor, {
      props: { content: null, onchange: vi.fn(), disabled: true },
    });
    const boldButton = screen.getByTitle('Bold');
    expect(boldButton).toBeDisabled();
  });

  it('renders with initial HTML content', () => {
    render(RichTextEditor, {
      props: { content: '<p>Hello world</p>', onchange: vi.fn() },
    });
    // The editor content div should be present
    const editorContent = document.querySelector('.ProseMirror');
    expect(editorContent).not.toBeNull();
  });
});
