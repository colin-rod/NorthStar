import { render, screen, fireEvent } from '@testing-library/svelte';
import { get } from 'svelte/store';
import { describe, it, expect, beforeEach } from 'vitest';

import NewButtonDropdown from '$lib/components/NewButtonDropdown.svelte';
import { projectSheetOpen } from '$lib/stores/issues';

describe('NewButtonDropdown', () => {
  beforeEach(() => {
    projectSheetOpen.set(false);
  });

  it('renders "New Project" button', () => {
    render(NewButtonDropdown);
    const button = screen.getByRole('button', { name: /new project/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('New Project');
  });

  it('sets projectSheetOpen to true when clicked', async () => {
    render(NewButtonDropdown);
    const button = screen.getByRole('button', { name: /new project/i });

    await fireEvent.click(button);

    expect(get(projectSheetOpen)).toBe(true);
  });
});
