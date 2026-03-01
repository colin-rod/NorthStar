import { render, screen, fireEvent } from '@testing-library/svelte';
import { get } from 'svelte/store';
import { describe, it, expect, beforeEach } from 'vitest';

import NewButtonDropdown from '$lib/components/NewButtonDropdown.svelte';
import { isIssueSheetOpen, projectSheetOpen } from '$lib/stores/issues';

describe('NewButtonDropdown', () => {
  beforeEach(() => {
    // Reset stores before each test
    isIssueSheetOpen.set(false);
    projectSheetOpen.set(false);
  });

  it('renders button with "New..." text and chevron icon', () => {
    render(NewButtonDropdown);
    const button = screen.getByRole('button', { name: /new/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('New...');
  });

  it('opens popover menu when button is clicked', async () => {
    render(NewButtonDropdown);
    const button = screen.getByRole('button', { name: /new/i });

    await fireEvent.click(button);

    // Menu should be visible
    expect(screen.getByText('New Issue')).toBeInTheDocument();
    expect(screen.getByText('New Project')).toBeInTheDocument();
  });

  it('shows menu options in correct order: Issue then Project', async () => {
    render(NewButtonDropdown);
    const button = screen.getByRole('button', { name: /new/i });

    await fireEvent.click(button);

    const menuItems = screen.getAllByRole('menuitem');
    expect(menuItems).toHaveLength(2);
    expect(menuItems[0]).toHaveTextContent('New Issue');
    expect(menuItems[1]).toHaveTextContent('New Project');
  });

  it('sets isIssueSheetOpen to true when "New Issue" is clicked', async () => {
    render(NewButtonDropdown);
    const button = screen.getByRole('button', { name: /new/i });

    await fireEvent.click(button);
    const newIssueOption = screen.getByText('New Issue');
    await fireEvent.click(newIssueOption);

    expect(get(isIssueSheetOpen)).toBe(true);
  });

  it('sets projectSheetOpen to true when "New Project" is clicked', async () => {
    render(NewButtonDropdown);
    const button = screen.getByRole('button', { name: /new/i });

    await fireEvent.click(button);
    const newProjectOption = screen.getByText('New Project');
    await fireEvent.click(newProjectOption);

    expect(get(projectSheetOpen)).toBe(true);
  });
});
