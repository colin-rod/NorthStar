import { writable, type Writable } from 'svelte/store';

import type { Issue } from '$lib/types';

/**
 * The issue currently hovered by the mouse.
 * Used by context-aware keyboard shortcuts (e, c, 1-4, s).
 */
export const focusedIssue: Writable<Issue | null> = writable(null);

/**
 * Controls visibility of the keyboard shortcuts help modal.
 */
export const shortcutsHelpOpen: Writable<boolean> = writable(false);

/**
 * Controls visibility of the story points picker dialog.
 */
export const storyPointsPickerOpen: Writable<boolean> = writable(false);
