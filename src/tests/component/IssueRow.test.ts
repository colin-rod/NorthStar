import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';

import IssueRow from '$lib/components/IssueRow.svelte';
import type { Issue } from '$lib/types';

describe('IssueRow - Blocked State Display', () => {
  it('should display "Blocked (2)" when issue has 2 blocking dependencies', () => {
    const issue: Issue = {
      id: '1',
      title: 'Test Issue',
      status: 'todo',
      priority: 0,
      project_id: 'proj-1',
      epic_id: 'epic-1',
      parent_issue_id: null,
      milestone_id: null,
      story_points: null,
      sort_order: 1,
      created_at: new Date().toISOString(),
      project: {
        id: 'proj-1',
        name: 'Test Project',
        user_id: 'user-1',
        created_at: new Date().toISOString(),
        archived_at: null,
      },
      epic: {
        id: 'epic-1',
        name: 'Test Epic',
        project_id: 'proj-1',
        status: 'active',
        is_default: false,
        sort_order: null,
      },
      dependencies: [
        {
          issue_id: '1',
          depends_on_issue_id: 'dep-1',
          depends_on_issue: {
            id: 'dep-1',
            title: 'Dependency 1',
            status: 'todo',
            priority: 0,
            project_id: 'proj-1',
            epic_id: 'epic-1',
            parent_issue_id: null,
            milestone_id: null,
            story_points: null,
            sort_order: 1,
            created_at: new Date().toISOString(),
          },
        },
        {
          issue_id: '1',
          depends_on_issue_id: 'dep-2',
          depends_on_issue: {
            id: 'dep-2',
            title: 'Dependency 2',
            status: 'doing',
            priority: 0,
            project_id: 'proj-1',
            epic_id: 'epic-1',
            parent_issue_id: null,
            milestone_id: null,
            story_points: null,
            sort_order: 2,
            created_at: new Date().toISOString(),
          },
        },
      ],
    };

    render(IssueRow, { props: { issue } });

    expect(screen.getByText('Blocked (2)')).toBeInTheDocument();
  });

  it('should display "Blocked (1)" when issue has 1 blocking dependency', () => {
    const issue: Issue = {
      id: '1',
      title: 'Test Issue',
      status: 'todo',
      priority: 0,
      project_id: 'proj-1',
      epic_id: 'epic-1',
      parent_issue_id: null,
      milestone_id: null,
      story_points: null,
      sort_order: 1,
      created_at: new Date().toISOString(),
      project: {
        id: 'proj-1',
        name: 'Test Project',
        user_id: 'user-1',
        created_at: new Date().toISOString(),
        archived_at: null,
      },
      epic: {
        id: 'epic-1',
        name: 'Test Epic',
        project_id: 'proj-1',
        status: 'active',
        is_default: false,
        sort_order: null,
      },
      dependencies: [
        {
          issue_id: '1',
          depends_on_issue_id: 'dep-1',
          depends_on_issue: {
            id: 'dep-1',
            title: 'Dependency 1',
            status: 'in_review',
            priority: 0,
            project_id: 'proj-1',
            epic_id: 'epic-1',
            parent_issue_id: null,
            milestone_id: null,
            story_points: null,
            sort_order: 1,
            created_at: new Date().toISOString(),
          },
        },
      ],
    };

    render(IssueRow, { props: { issue } });

    expect(screen.getByText('Blocked (1)')).toBeInTheDocument();
  });

  it('should NOT display blocked badge when issue has no blocking dependencies', () => {
    const issue: Issue = {
      id: '1',
      title: 'Test Issue',
      status: 'todo',
      priority: 0,
      project_id: 'proj-1',
      epic_id: 'epic-1',
      parent_issue_id: null,
      milestone_id: null,
      story_points: null,
      sort_order: 1,
      created_at: new Date().toISOString(),
      project: {
        id: 'proj-1',
        name: 'Test Project',
        user_id: 'user-1',
        created_at: new Date().toISOString(),
        archived_at: null,
      },
      epic: {
        id: 'epic-1',
        name: 'Test Epic',
        project_id: 'proj-1',
        status: 'active',
        is_default: false,
        sort_order: null,
      },
      dependencies: [],
    };

    render(IssueRow, { props: { issue } });

    expect(screen.queryByText(/Blocked/)).not.toBeInTheDocument();
  });

  it('should NOT display blocked badge when all dependencies are satisfied', () => {
    const issue: Issue = {
      id: '1',
      title: 'Test Issue',
      status: 'todo',
      priority: 0,
      project_id: 'proj-1',
      epic_id: 'epic-1',
      parent_issue_id: null,
      milestone_id: null,
      story_points: null,
      sort_order: 1,
      created_at: new Date().toISOString(),
      project: {
        id: 'proj-1',
        name: 'Test Project',
        user_id: 'user-1',
        created_at: new Date().toISOString(),
        archived_at: null,
      },
      epic: {
        id: 'epic-1',
        name: 'Test Epic',
        project_id: 'proj-1',
        status: 'active',
        is_default: false,
        sort_order: null,
      },
      dependencies: [
        {
          issue_id: '1',
          depends_on_issue_id: 'dep-1',
          depends_on_issue: {
            id: 'dep-1',
            title: 'Dependency 1',
            status: 'done',
            priority: 0,
            project_id: 'proj-1',
            epic_id: 'epic-1',
            parent_issue_id: null,
            milestone_id: null,
            story_points: null,
            sort_order: 1,
            created_at: new Date().toISOString(),
          },
        },
        {
          issue_id: '1',
          depends_on_issue_id: 'dep-2',
          depends_on_issue: {
            id: 'dep-2',
            title: 'Dependency 2',
            status: 'canceled',
            priority: 0,
            project_id: 'proj-1',
            epic_id: 'epic-1',
            parent_issue_id: null,
            milestone_id: null,
            story_points: null,
            sort_order: 2,
            created_at: new Date().toISOString(),
          },
        },
      ],
    };

    render(IssueRow, { props: { issue } });

    expect(screen.queryByText(/Blocked/)).not.toBeInTheDocument();
  });
});
