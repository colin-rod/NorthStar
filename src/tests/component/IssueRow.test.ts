import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';

import IssueRow from '$lib/components/IssueRow.svelte';
import type { Issue } from '$lib/types';

describe('IssueRow - Blocked State Display', () => {
  it('should display dependency chip with "2 blocked" when issue has 2 blocking dependencies', () => {
    const issue: Issue = {
      id: '1',
      number: 1,
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
      description: null,
      project: {
        id: 'proj-1',
        number: 1,
        name: 'Test Project',
        user_id: 'user-1',
        created_at: new Date().toISOString(),
        archived_at: null,
        status: 'active',
        description: null,
      },
      epic: {
        id: 'epic-1',
        number: 1,
        name: 'Test Epic',
        project_id: 'proj-1',
        status: 'active',
        is_default: false,
        sort_order: null,
        description: null,
        priority: null,
      },
      dependencies: [
        {
          issue_id: '1',
          depends_on_issue_id: 'dep-1',
          depends_on_issue: {
            id: 'dep-1',
            number: 1,
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
            description: null,
          },
        },
        {
          issue_id: '1',
          depends_on_issue_id: 'dep-2',
          depends_on_issue: {
            id: 'dep-2',
            number: 2,
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
            description: null,
          },
        },
      ],
    };

    render(IssueRow, { props: { issue } });

    expect(screen.getByTestId('dependency-chip')).toBeInTheDocument();
    expect(screen.getByText('2 blocked')).toBeInTheDocument();
  });

  it('should display dependency chip with "1 blocked" when issue has 1 blocking dependency', () => {
    const issue: Issue = {
      id: '1',
      number: 1,
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
      description: null,
      project: {
        id: 'proj-1',
        number: 1,
        name: 'Test Project',
        user_id: 'user-1',
        created_at: new Date().toISOString(),
        archived_at: null,
        status: 'active',
        description: null,
      },
      epic: {
        id: 'epic-1',
        number: 1,
        name: 'Test Epic',
        project_id: 'proj-1',
        status: 'active',
        is_default: false,
        sort_order: null,
        description: null,
        priority: null,
      },
      dependencies: [
        {
          issue_id: '1',
          depends_on_issue_id: 'dep-1',
          depends_on_issue: {
            id: 'dep-1',
            number: 1,
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
            description: null,
          },
        },
      ],
    };

    render(IssueRow, { props: { issue } });

    expect(screen.getByText('1 blocked')).toBeInTheDocument();
  });

  it('should NOT display dependency chip when issue has no dependencies', () => {
    const issue: Issue = {
      id: '1',
      number: 1,
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
      description: null,
      project: {
        id: 'proj-1',
        number: 1,
        name: 'Test Project',
        user_id: 'user-1',
        created_at: new Date().toISOString(),
        archived_at: null,
        status: 'active',
        description: null,
      },
      epic: {
        id: 'epic-1',
        number: 1,
        name: 'Test Epic',
        project_id: 'proj-1',
        status: 'active',
        is_default: false,
        sort_order: null,
        description: null,
        priority: null,
      },
      dependencies: [],
    };

    render(IssueRow, { props: { issue } });

    expect(screen.queryByTestId('dependency-chip')).not.toBeInTheDocument();
  });

  it('should display satisfied deps chip when all dependencies are done', () => {
    const issue: Issue = {
      id: '1',
      number: 1,
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
      description: null,
      project: {
        id: 'proj-1',
        number: 1,
        name: 'Test Project',
        user_id: 'user-1',
        created_at: new Date().toISOString(),
        archived_at: null,
        status: 'active',
        description: null,
      },
      epic: {
        id: 'epic-1',
        number: 1,
        name: 'Test Epic',
        project_id: 'proj-1',
        status: 'active',
        is_default: false,
        sort_order: null,
        description: null,
        priority: null,
      },
      dependencies: [
        {
          issue_id: '1',
          depends_on_issue_id: 'dep-1',
          depends_on_issue: {
            id: 'dep-1',
            number: 1,
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
            description: null,
          },
        },
        {
          issue_id: '1',
          depends_on_issue_id: 'dep-2',
          depends_on_issue: {
            id: 'dep-2',
            number: 2,
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
            description: null,
          },
        },
      ],
    };

    render(IssueRow, { props: { issue } });

    // Should show satisfied chip, not blocked
    expect(screen.queryByText(/blocked/)).not.toBeInTheDocument();
    expect(screen.getByText('2 deps')).toBeInTheDocument();
  });
});

describe('IssueRow - Additional Scenarios', () => {
  const baseIssue: Issue = {
    id: '1',
    number: 1,
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
    description: null,
    project: {
      id: 'proj-1',
      number: 1,
      name: 'Test Project',
      user_id: 'user-1',
      created_at: new Date().toISOString(),
      archived_at: null,
      status: 'active',
      description: null,
    },
    epic: {
      id: 'epic-1',
      number: 1,
      name: 'Test Epic',
      project_id: 'proj-1',
      status: 'active',
      is_default: false,
      sort_order: null,
      description: null,
      priority: null,
    },
    dependencies: [],
  };

  it('should render priority badge', () => {
    render(IssueRow, { props: { issue: baseIssue } });
    expect(screen.getByText('P0')).toBeInTheDocument();
  });

  it('should render different priority levels', () => {
    const p3Issue = { ...baseIssue, priority: 3 };
    const { rerender } = render(IssueRow, { props: { issue: p3Issue } });
    expect(screen.getByText('P3')).toBeInTheDocument();

    const p1Issue = { ...baseIssue, priority: 1 };
    rerender({ issue: p1Issue });
    expect(screen.getByText('P1')).toBeInTheDocument();
  });

  it('should render expand/collapse chevron when hasSubIssues is true', () => {
    render(IssueRow, {
      props: {
        issue: baseIssue,
        hasSubIssues: true,
        subIssueCount: 3,
        doneSubIssueCount: 0,
        isExpanded: false,
      },
    });

    expect(screen.getByLabelText('Expand sub-issues')).toBeInTheDocument();
    expect(screen.getByText('0/3')).toBeInTheDocument();
  });

  it('should render sub-issue pill with correct done count', () => {
    render(IssueRow, {
      props: {
        issue: baseIssue,
        hasSubIssues: true,
        subIssueCount: 3,
        doneSubIssueCount: 2,
        isExpanded: false,
      },
    });

    expect(screen.getByText('2/3')).toBeInTheDocument();
  });

  it('should render sub-issue pill with all done (1/1)', () => {
    render(IssueRow, {
      props: {
        issue: baseIssue,
        hasSubIssues: true,
        subIssueCount: 1,
        doneSubIssueCount: 1,
        isExpanded: false,
      },
    });

    expect(screen.getByText('1/1')).toBeInTheDocument();
  });

  it('should not render sub-issue pill when hasSubIssues is false', () => {
    render(IssueRow, {
      props: {
        issue: baseIssue,
        hasSubIssues: false,
        subIssueCount: 0,
        doneSubIssueCount: 0,
      },
    });

    expect(screen.queryByText(/\d+\/\d+/)).not.toBeInTheDocument();
  });

  it('should show expanded chevron when isExpanded is true', () => {
    render(IssueRow, {
      props: {
        issue: baseIssue,
        hasSubIssues: true,
        subIssueCount: 2,
        doneSubIssueCount: 0,
        isExpanded: true,
      },
    });

    expect(screen.getByLabelText('Collapse sub-issues')).toBeInTheDocument();
  });

  it('should render move up button when onMoveUp is provided', () => {
    const onMoveUp = vi.fn();
    render(IssueRow, {
      props: {
        issue: baseIssue,
        onMoveUp,
      },
    });

    expect(screen.getByLabelText('Move up')).toBeInTheDocument();
  });

  it('should render move down button when onMoveDown is provided', () => {
    const onMoveDown = vi.fn();
    render(IssueRow, {
      props: {
        issue: baseIssue,
        onMoveDown,
      },
    });

    expect(screen.getByLabelText('Move down')).toBeInTheDocument();
  });

  it('should render both move buttons when both handlers provided', () => {
    const onMoveUp = vi.fn();
    const onMoveDown = vi.fn();
    render(IssueRow, {
      props: {
        issue: baseIssue,
        onMoveUp,
        onMoveDown,
      },
    });

    expect(screen.getByLabelText('Move up')).toBeInTheDocument();
    expect(screen.getByLabelText('Move down')).toBeInTheDocument();
  });

  it('should render drag handle', () => {
    render(IssueRow, { props: { issue: baseIssue } });
    expect(screen.getByLabelText('Drag to reorder')).toBeInTheDocument();
  });

  it('should render issue title', () => {
    render(IssueRow, { props: { issue: baseIssue } });
    expect(screen.getByText('Test Issue')).toBeInTheDocument();
  });

  it('should render project and epic names', () => {
    render(IssueRow, { props: { issue: baseIssue } });
    expect(screen.getByText(/Test Project \/ Test Epic/)).toBeInTheDocument();
  });

  it('should render with different status colors', () => {
    const statuses: Array<Issue['status']> = ['todo', 'doing', 'in_review', 'done', 'canceled'];

    statuses.forEach((status) => {
      const statusIssue = { ...baseIssue, status };
      const { container } = render(IssueRow, { props: { issue: statusIssue } });

      // Check that the status dot exists (we can't easily check color, but we can check it renders)
      const statusDot = container.querySelector('.rounded-full');
      expect(statusDot).toBeInTheDocument();
    });
  });

  it('should call onMoveUp when move up button is clicked', async () => {
    const onMoveUp = vi.fn();
    render(IssueRow, {
      props: {
        issue: baseIssue,
        onMoveUp,
      },
    });

    const moveUpButton = screen.getByLabelText('Move up');
    await fireEvent.click(moveUpButton);

    expect(onMoveUp).toHaveBeenCalledTimes(1);
  });

  it('should call onMoveDown when move down button is clicked', async () => {
    const onMoveDown = vi.fn();
    render(IssueRow, {
      props: {
        issue: baseIssue,
        onMoveDown,
      },
    });

    const moveDownButton = screen.getByLabelText('Move down');
    await fireEvent.click(moveDownButton);

    expect(onMoveDown).toHaveBeenCalledTimes(1);
  });

  it('should call onToggleExpand when chevron is clicked', async () => {
    const onToggleExpand = vi.fn();
    render(IssueRow, {
      props: {
        issue: baseIssue,
        hasSubIssues: true,
        subIssueCount: 2,
        doneSubIssueCount: 0,
        isExpanded: false,
        onToggleExpand,
      },
    });

    const chevron = screen.getByLabelText('Expand sub-issues');
    await fireEvent.click(chevron);

    expect(onToggleExpand).toHaveBeenCalledTimes(1);
  });

  it('should call onClick when issue row is clicked', async () => {
    const onClick = vi.fn();
    render(IssueRow, {
      props: {
        issue: baseIssue,
        onClick,
      },
    });

    const issueTitle = screen.getByText('Test Issue');
    await fireEvent.click(issueTitle);

    expect(onClick).toHaveBeenCalled();
  });

  it('should handle click on chevron button', async () => {
    const onToggleExpand = vi.fn();
    render(IssueRow, {
      props: {
        issue: baseIssue,
        hasSubIssues: true,
        subIssueCount: 2,
        doneSubIssueCount: 0,
        isExpanded: false,
        onToggleExpand,
      },
    });

    const chevron = screen.getByLabelText('Expand sub-issues');

    // Chevron is a native <button>, so Enter/Space are handled by the browser.
    // Verify click works correctly.
    await fireEvent.click(chevron);
    expect(onToggleExpand).toHaveBeenCalledTimes(1);

    await fireEvent.click(chevron);
    expect(onToggleExpand).toHaveBeenCalledTimes(2);
  });

  it('should handle drag events on drag handle', async () => {
    render(IssueRow, {
      props: {
        issue: baseIssue,
        dragDisabled: true,
      },
    });

    const dragHandle = screen.getByLabelText('Drag to reorder');

    // Test mousedown enables dragging
    await fireEvent.mouseDown(dragHandle);

    // Test mouseup disables dragging
    await fireEvent.mouseUp(dragHandle);

    // Test mouseleave disables dragging
    await fireEvent.mouseLeave(dragHandle);

    expect(dragHandle).toBeInTheDocument();
  });

  it('should not render chevron or expand button when hasSubIssues is false', () => {
    render(IssueRow, {
      props: {
        issue: baseIssue,
        hasSubIssues: false,
      },
    });

    expect(screen.queryByLabelText('Expand sub-issues')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Collapse sub-issues')).not.toBeInTheDocument();
  });

  it('should not render move buttons when onMoveUp and onMoveDown are not provided', () => {
    render(IssueRow, {
      props: {
        issue: baseIssue,
      },
    });

    expect(screen.queryByLabelText('Move up')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Move down')).not.toBeInTheDocument();
  });

  it('should handle touch events on drag handle', async () => {
    render(IssueRow, {
      props: {
        issue: baseIssue,
        dragDisabled: true,
      },
    });

    const dragHandle = screen.getByLabelText('Drag to reorder');

    // Test touchstart enables dragging
    await fireEvent.touchStart(dragHandle);

    // Test touchend disables dragging
    await fireEvent.touchEnd(dragHandle);

    expect(dragHandle).toBeInTheDocument();
  });
});

describe('IssueRow - Accessibility: No Nested Interactive Elements', () => {
  const baseIssue: Issue = {
    id: '1',
    number: 1,
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
    description: null,
    project: {
      id: 'proj-1',
      number: 1,
      name: 'Test Project',
      user_id: 'user-1',
      created_at: new Date().toISOString(),
      archived_at: null,
      status: 'active',
      description: null,
    },
    epic: {
      id: 'epic-1',
      number: 1,
      name: 'Test Epic',
      project_id: 'proj-1',
      status: 'active',
      is_default: false,
      sort_order: null,
      description: null,
      priority: null,
    },
    dependencies: [],
  };

  it('should not have nested interactive elements inside buttons', () => {
    const { container } = render(IssueRow, {
      props: {
        issue: baseIssue,
        hasSubIssues: true,
        subIssueCount: 3,
        doneSubIssueCount: 1,
        isExpanded: false,
        onToggleExpand: vi.fn(),
      },
    });

    const buttons = container.querySelectorAll('button');
    buttons.forEach((button) => {
      const nestedInteractive = button.querySelectorAll('button, [role="button"]');
      expect(nestedInteractive.length).toBe(0);
    });
  });

  it('should render chevron as a button element, not a div with role="button"', () => {
    render(IssueRow, {
      props: {
        issue: baseIssue,
        hasSubIssues: true,
        subIssueCount: 2,
        doneSubIssueCount: 0,
        isExpanded: false,
        onToggleExpand: vi.fn(),
      },
    });

    const chevron = screen.getByLabelText('Expand sub-issues');
    expect(chevron.tagName).toBe('BUTTON');
  });

  it('should not call onClick when chevron is clicked', async () => {
    const onClick = vi.fn();
    const onToggleExpand = vi.fn();
    render(IssueRow, {
      props: {
        issue: baseIssue,
        hasSubIssues: true,
        subIssueCount: 2,
        doneSubIssueCount: 0,
        isExpanded: false,
        onClick,
        onToggleExpand,
      },
    });

    const chevron = screen.getByLabelText('Expand sub-issues');
    await fireEvent.click(chevron);

    expect(onToggleExpand).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();
  });
});
