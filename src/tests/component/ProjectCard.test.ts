import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';

import ProjectCard from '$lib/components/ProjectCard.svelte';
import type { Project } from '$lib/types';

const baseProject: Project = {
  id: 'proj-1',
  user_id: 'user-1',
  number: 1,
  name: 'Test Project',
  description: null,
  created_at: new Date().toISOString(),
  archived_at: null,
  status: 'active',
};

describe('ProjectCard - Accessibility: No Nested Interactive Elements', () => {
  it('should not have buttons nested inside a button in drill-down mode', () => {
    const { container } = render(ProjectCard, {
      props: {
        project: baseProject,
        onToggle: vi.fn(),
        onEdit: vi.fn(),
        onArchive: vi.fn(),
      },
    });

    const buttons = container.querySelectorAll('button');
    buttons.forEach((button) => {
      const nestedButtons = button.querySelectorAll('button');
      expect(nestedButtons.length).toBe(0);
    });
  });

  it('should not have buttons nested inside an anchor in navigation mode', () => {
    const { container } = render(ProjectCard, {
      props: {
        project: baseProject,
        onEdit: vi.fn(),
        onArchive: vi.fn(),
      },
    });

    const anchors = container.querySelectorAll('a');
    anchors.forEach((anchor) => {
      const nestedButtons = anchor.querySelectorAll('button');
      expect(nestedButtons.length).toBe(0);
    });
  });

  it('should call onToggle when overlay is clicked in drill-down mode', async () => {
    const onToggle = vi.fn();
    render(ProjectCard, {
      props: {
        project: baseProject,
        onToggle,
      },
    });

    const overlay = screen.getByLabelText('Expand Test Project');
    await fireEvent.click(overlay);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('should call onEdit without triggering onToggle when edit button is clicked', async () => {
    const onToggle = vi.fn();
    const onEdit = vi.fn();
    render(ProjectCard, {
      props: {
        project: baseProject,
        onToggle,
        onEdit,
      },
    });

    const editButton = screen.getByLabelText('Edit project');
    await fireEvent.click(editButton);
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('should render navigation link with correct href in navigation mode', () => {
    const { container } = render(ProjectCard, {
      props: {
        project: baseProject,
      },
    });

    const link = container.querySelector('a[href="/projects/proj-1"]');
    expect(link).toBeInTheDocument();
  });
});
