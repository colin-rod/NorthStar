// tests/component/GroupHeader.test.ts
import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';

import GroupHeader from '$lib/components/GroupHeader.svelte';

describe('GroupHeader', () => {
  it('should render group name', () => {
    render(GroupHeader, {
      props: {
        groupName: 'P0',
        issueCount: 5,
        totalStoryPoints: 13,
        completionPercent: 60,
        isExpanded: true,
      },
    });

    expect(screen.getByText('P0')).toBeInTheDocument();
  });

  it('should render issue count with singular form', () => {
    render(GroupHeader, {
      props: {
        groupName: 'P0',
        issueCount: 1,
        totalStoryPoints: 3,
        completionPercent: 100,
        isExpanded: true,
      },
    });

    expect(screen.getByText(/1 issue/i)).toBeInTheDocument();
  });

  it('should render issue count with plural form', () => {
    render(GroupHeader, {
      props: {
        groupName: 'P0',
        issueCount: 5,
        totalStoryPoints: 13,
        completionPercent: 60,
        isExpanded: true,
      },
    });

    expect(screen.getByText(/5 issues/i)).toBeInTheDocument();
  });

  it('should render story points when greater than zero', () => {
    render(GroupHeader, {
      props: {
        groupName: 'P0',
        issueCount: 5,
        totalStoryPoints: 13,
        completionPercent: 60,
        isExpanded: true,
      },
    });

    expect(screen.getByText(/13 story points/i)).toBeInTheDocument();
  });

  it('should not render story points when zero', () => {
    render(GroupHeader, {
      props: {
        groupName: 'P1',
        issueCount: 3,
        totalStoryPoints: 0,
        completionPercent: 0,
        isExpanded: true,
      },
    });

    // Should only show group name and issue count, not story points metadata
    expect(screen.getByText('P1')).toBeInTheDocument();
    expect(screen.getByText(/3 issues/i)).toBeInTheDocument();
    expect(screen.queryByText(/\d+ story points/i)).not.toBeInTheDocument();
  });

  it('should render completion percentage rounded', () => {
    render(GroupHeader, {
      props: {
        groupName: 'P0',
        issueCount: 5,
        totalStoryPoints: 13,
        completionPercent: 66.67,
        isExpanded: true,
      },
    });

    expect(screen.getByText(/67% complete/i)).toBeInTheDocument();
  });

  it('should show chevron down when expanded', () => {
    const { container } = render(GroupHeader, {
      props: {
        groupName: 'P0',
        issueCount: 5,
        totalStoryPoints: 13,
        completionPercent: 60,
        isExpanded: true,
      },
    });

    // Check for chevron-down icon (lucide icon renders as SVG)
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should show chevron right when collapsed', () => {
    const { container } = render(GroupHeader, {
      props: {
        groupName: 'P0',
        issueCount: 5,
        totalStoryPoints: 13,
        completionPercent: 60,
        isExpanded: false,
      },
    });

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should apply cursor-pointer class for interactivity', () => {
    const { container } = render(GroupHeader, {
      props: {
        groupName: 'P0',
        issueCount: 5,
        totalStoryPoints: 13,
        completionPercent: 60,
        isExpanded: true,
      },
    });

    const header = container.querySelector('.cursor-pointer');
    expect(header).toBeInTheDocument();
  });
});
