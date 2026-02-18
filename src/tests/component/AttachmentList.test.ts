/**
 * TDD Tests for AttachmentList component
 * RED phase: These tests will fail until the component is implemented
 */
import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';

import AttachmentList from '$lib/components/AttachmentList.svelte';
import type { Attachment } from '$lib/types';

const mockAttachment: Attachment = {
  id: 'att-1',
  user_id: 'user-1',
  entity_type: 'issue',
  entity_id: 'issue-1',
  file_name: 'document.pdf',
  file_size: 102400,
  mime_type: 'application/pdf',
  storage_path: 'user-1/issue/issue-1/uuid-document.pdf',
  created_at: new Date().toISOString(),
};

describe('AttachmentList', () => {
  it('shows "Add attachment" link when no attachments', () => {
    render(AttachmentList, {
      props: {
        attachments: [],
        onUpload: vi.fn(),
        onDelete: vi.fn(),
      },
    });
    expect(screen.getByText('Add attachment')).toBeTruthy();
  });

  it('renders attachment file names', () => {
    render(AttachmentList, {
      props: {
        attachments: [mockAttachment],
        onUpload: vi.fn(),
        onDelete: vi.fn(),
      },
    });
    expect(screen.getByText('document.pdf')).toBeTruthy();
  });

  it('renders formatted file size', () => {
    render(AttachmentList, {
      props: {
        attachments: [mockAttachment],
        onUpload: vi.fn(),
        onDelete: vi.fn(),
      },
    });
    expect(screen.getByText('(100.0 KB)')).toBeTruthy();
  });

  it('renders Remove button for each attachment', () => {
    render(AttachmentList, {
      props: {
        attachments: [mockAttachment],
        onUpload: vi.fn(),
        onDelete: vi.fn(),
      },
    });
    expect(screen.getByText('Remove')).toBeTruthy();
  });

  it('calls onDelete when Remove is clicked', async () => {
    const onDelete = vi.fn();
    render(AttachmentList, {
      props: {
        attachments: [mockAttachment],
        onUpload: vi.fn(),
        onDelete,
      },
    });
    await fireEvent.click(screen.getByText('Remove'));
    expect(onDelete).toHaveBeenCalledWith(mockAttachment);
  });

  it('hides Add attachment and Remove controls when disabled', () => {
    render(AttachmentList, {
      props: {
        attachments: [mockAttachment],
        onUpload: vi.fn(),
        onDelete: vi.fn(),
        disabled: true,
      },
    });
    expect(screen.queryByText('Add attachment')).toBeNull();
    expect(screen.queryByText('Remove')).toBeNull();
  });

  it('renders multiple attachments', () => {
    const secondAttachment: Attachment = {
      ...mockAttachment,
      id: 'att-2',
      file_name: 'image.png',
      mime_type: 'image/png',
    };
    render(AttachmentList, {
      props: {
        attachments: [mockAttachment, secondAttachment],
        onUpload: vi.fn(),
        onDelete: vi.fn(),
      },
    });
    expect(screen.getByText('document.pdf')).toBeTruthy();
    expect(screen.getByText('image.png')).toBeTruthy();
  });
});
