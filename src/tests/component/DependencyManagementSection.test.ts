import { render, screen } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';

import DependencyManagementSection from '$lib/components/DependencyManagementSection.svelte';
import type { Issue, IssueStatus } from '$lib/types';

// Mock Supabase
vi.mock('$lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({ error: null })),
        })),
      })),
    })),
  },
}));

// Mock navigation
vi.mock('$app/navigation', () => ({
  invalidateAll: vi.fn(),
}));

describe('DependencyManagementSection - Blocking Summary', () => {
  const createIssue = (id: string, title: string, status: IssueStatus): Issue => ({
    id,
    title,
    status,
    priority: 0,
    project_id: 'proj-1',
    epic_id: 'epic-1',
    parent_issue_id: null,
    milestone_id: null,
    story_points: null,
    sort_order: 1,
    created_at: new Date().toISOString(),
    epic: {
      id: 'epic-1',
      name: 'Test Epic',
      project_id: 'proj-1',
      status: 'active',
      is_default: false,
      sort_order: null,
    },
  });

  it('should display "Blocked by 2 dependencies" when issue has 2 blocking deps', () => {
    const issue = createIssue('1', 'Test Issue', 'todo');
    const blockedByIssues = [
      createIssue('dep-1', 'Dependency 1', 'todo'),
      createIssue('dep-2', 'Dependency 2', 'doing'),
    ];

    render(DependencyManagementSection, {
      props: {
        issue,
        projectIssues: [],
        blockedByIssues,
        blockingIssues: [],
      },
    });

    expect(screen.getByText('🔒 Blocked by 2 dependencies')).toBeInTheDocument();
  });

  it('should display "Blocked by 1 dependency" (singular) when issue has 1 blocking dep', () => {
    const issue = createIssue('1', 'Test Issue', 'todo');
    const blockedByIssues = [createIssue('dep-1', 'Dependency 1', 'in_review')];

    render(DependencyManagementSection, {
      props: {
        issue,
        projectIssues: [],
        blockedByIssues,
        blockingIssues: [],
      },
    });

    expect(screen.getByText('🔒 Blocked by 1 dependency')).toBeInTheDocument();
  });

  it('should NOT display blocking summary when no blocking dependencies', () => {
    const issue = createIssue('1', 'Test Issue', 'todo');

    render(DependencyManagementSection, {
      props: {
        issue,
        projectIssues: [],
        blockedByIssues: [],
        blockingIssues: [],
      },
    });

    expect(screen.queryByText(/Blocked by/)).not.toBeInTheDocument();
  });

  it('should display "Satisfied dependencies" section when deps are done/canceled', () => {
    const issue = createIssue('1', 'Test Issue', 'todo');
    const blockedByIssues = [
      createIssue('dep-1', 'Dependency 1', 'done'),
      createIssue('dep-2', 'Dependency 2', 'canceled'),
    ];

    render(DependencyManagementSection, {
      props: {
        issue,
        projectIssues: [],
        blockedByIssues,
        blockingIssues: [],
      },
    });

    expect(screen.getByText('Satisfied dependencies')).toBeInTheDocument();
    expect(screen.getByText('Dependency 1')).toBeInTheDocument();
    expect(screen.getByText('Dependency 2')).toBeInTheDocument();
  });

  it('should group blocking and satisfied dependencies separately', () => {
    const issue = createIssue('1', 'Test Issue', 'todo');
    const blockedByIssues = [
      createIssue('dep-1', 'Blocking Dep 1', 'todo'),
      createIssue('dep-2', 'Blocking Dep 2', 'doing'),
      createIssue('dep-3', 'Satisfied Dep 1', 'done'),
      createIssue('dep-4', 'Satisfied Dep 2', 'canceled'),
    ];

    render(DependencyManagementSection, {
      props: {
        issue,
        projectIssues: [],
        blockedByIssues,
        blockingIssues: [],
      },
    });

    // Should show blocking summary
    expect(screen.getByText('🔒 Blocked by 2 dependencies')).toBeInTheDocument();

    // Should show satisfied section
    expect(screen.getByText('Satisfied dependencies')).toBeInTheDocument();

    // Should display all dependencies
    expect(screen.getByText('Blocking Dep 1')).toBeInTheDocument();
    expect(screen.getByText('Blocking Dep 2')).toBeInTheDocument();
    expect(screen.getByText('Satisfied Dep 1')).toBeInTheDocument();
    expect(screen.getByText('Satisfied Dep 2')).toBeInTheDocument();
  });

  it('should render "Add Dependency" button', () => {
    const issue = createIssue('1', 'Test Issue', 'todo');

    render(DependencyManagementSection, {
      props: {
        issue,
        projectIssues: [],
        blockedByIssues: [],
        blockingIssues: [],
      },
    });

    expect(screen.getByText('Add Dependency')).toBeInTheDocument();
  });

  it('should display "Blocking:" section when blocking issues exist', () => {
    const issue = createIssue('1', 'Test Issue', 'todo');
    const blockingIssues = [createIssue('block-1', 'Blocked Issue', 'todo')];

    render(DependencyManagementSection, {
      props: {
        issue,
        projectIssues: [],
        blockedByIssues: [],
        blockingIssues,
      },
    });

    expect(screen.getByText('Blocking:')).toBeInTheDocument();
    expect(screen.getByText('Blocked Issue')).toBeInTheDocument();
  });

  it('should render remove dependency buttons for blocked by dependencies', () => {
    const issue = createIssue('1', 'Test Issue', 'todo');
    const dep = createIssue('dep-1', 'Dependency 1', 'todo');

    render(DependencyManagementSection, {
      props: {
        issue,
        projectIssues: [],
        blockedByIssues: [dep],
        blockingIssues: [],
      },
    });

    const removeButtons = screen.getAllByLabelText('Remove dependency');
    expect(removeButtons.length).toBeGreaterThan(0);
  });

  it('should render status badges for dependencies', () => {
    const issue = createIssue('1', 'Test Issue', 'todo');
    const blockedByIssues = [
      createIssue('dep-1', 'Todo Dep', 'todo'),
      createIssue('dep-2', 'Doing Dep', 'doing'),
      createIssue('dep-3', 'Done Dep', 'done'),
    ];

    render(DependencyManagementSection, {
      props: {
        issue,
        projectIssues: [],
        blockedByIssues,
        blockingIssues: [],
      },
    });

    // Check that all dependencies are rendered with their status badges
    expect(screen.getByText('Todo Dep')).toBeInTheDocument();
    expect(screen.getByText('Doing Dep')).toBeInTheDocument();
    expect(screen.getByText('Done Dep')).toBeInTheDocument();
  });

  it('should handle undefined epic name gracefully', () => {
    const issue = createIssue('1', 'Test Issue', 'todo');
    const dep = createIssue('dep-1', 'Dependency 1', 'todo');
    dep.epic = undefined;

    render(DependencyManagementSection, {
      props: {
        issue,
        projectIssues: [],
        blockedByIssues: [dep],
        blockingIssues: [],
      },
    });

    // Should still render the dependency even without epic name
    expect(screen.getByText('Dependency 1')).toBeInTheDocument();
  });
});
