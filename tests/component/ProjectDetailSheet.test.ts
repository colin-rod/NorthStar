/**
 * TDD Tests for ProjectDetailSheet component
 * RED phase: These tests will fail until the component is implemented
 */
import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';

import ProjectDetailSheet from '$lib/components/ProjectDetailSheet.svelte';
import type { Project, Epic } from '$lib/types';
import type { IssueCounts } from '$lib/utils/issue-counts';
import type { ProjectMetrics } from '$lib/utils/project-helpers';

const mockProject: Project = {
  id: 'p1',
  user_id: 'u1',
  number: 1,
  name: 'Test Project',
  created_at: '2024-01-01',
  archived_at: null,
  description: null,
};

const mockCounts: IssueCounts = {
  ready: 3,
  blocked: 1,
  doing: 2,
  inReview: 1,
  done: 5,
  canceled: 1,
};

const mockMetrics: ProjectMetrics = {
  totalIssues: 13,
  activeStoryPoints: 21,
  totalStoryPoints: 34,
};

const mockEpics: Epic[] = [
  {
    id: 'e1',
    project_id: 'p1',
    number: 1,
    name: 'Epic One',
    status: 'active',
    is_default: false,
    sort_order: 0,
    description: null,
  },
  {
    id: 'e2',
    project_id: 'p1',
    number: 2,
    name: 'Epic Two',
    status: 'done',
    is_default: false,
    sort_order: 1,
    description: null,
  },
];

describe('ProjectDetailSheet', () => {
  it('does not render content when open is false', () => {
    render(ProjectDetailSheet, {
      props: {
        open: false,
        project: mockProject,
        counts: mockCounts,
        metrics: mockMetrics,
        epics: mockEpics,
      },
    });
    expect(screen.queryByDisplayValue('Test Project')).toBeNull();
  });

  it('renders project name in an input when open', () => {
    render(ProjectDetailSheet, {
      props: {
        open: true,
        project: mockProject,
        counts: mockCounts,
        metrics: mockMetrics,
        epics: mockEpics,
      },
    });
    expect(screen.getByDisplayValue('Test Project')).toBeTruthy();
  });

  it('renders all 6 count badges when open', () => {
    render(ProjectDetailSheet, {
      props: {
        open: true,
        project: mockProject,
        counts: mockCounts,
        metrics: mockMetrics,
        epics: mockEpics,
      },
    });
    expect(screen.getByText('Ready')).toBeTruthy();
    expect(screen.getByText('Doing')).toBeTruthy();
    expect(screen.getByText('In Review')).toBeTruthy();
    expect(screen.getByText('Blocked')).toBeTruthy();
    expect(screen.getByText('Done')).toBeTruthy();
    expect(screen.getByText('Canceled')).toBeTruthy();
  });

  it('renders epic names in the epics list', () => {
    render(ProjectDetailSheet, {
      props: {
        open: true,
        project: mockProject,
        counts: mockCounts,
        metrics: mockMetrics,
        epics: mockEpics,
      },
    });
    expect(screen.getByText('Epic One')).toBeTruthy();
    expect(screen.getByText('Epic Two')).toBeTruthy();
  });

  it('renders without epics list when epics array is empty', () => {
    render(ProjectDetailSheet, {
      props: {
        open: true,
        project: mockProject,
        counts: mockCounts,
        metrics: mockMetrics,
        epics: [],
      },
    });
    // Should not throw - graceful empty state
    expect(screen.getByDisplayValue('Test Project')).toBeTruthy();
  });
});
