import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';

import DependencyManagementSection from '$lib/components/DependencyManagementSection.svelte';
import type { Issue, IssueStatus } from '$lib/types';

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
});
