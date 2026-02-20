/**
 * Issue Stores
 *
 * Svelte stores for managing issue state.
 *
 * Requirements from CLAUDE.md:
 * - Writable stores for issues
 * - Single-user, no real-time sync needed
 */

import { writable, type Writable } from 'svelte/store';

import type { Issue, Project, Epic } from '$lib/types';

/**
 * Main issues store
 *
 * Holds all loaded issues. Typically populated from server load functions.
 */
export const issues: Writable<Issue[]> = writable([]);

/**
 * Projects store
 */
export const projects: Writable<Project[]> = writable([]);

/**
 * Epics store
 */
export const epics: Writable<Epic[]> = writable([]);

/**
 * Currently selected issue (for editing in sheet)
 */
export const selectedIssue: Writable<Issue | null> = writable(null);

/**
 * Issue sheet open state
 */
export const isIssueSheetOpen: Writable<boolean> = writable(false);

/**
 * Project sheet open state
 */
export const projectSheetOpen: Writable<boolean> = writable(false);

/**
 * Helper function to open issue sheet
 */
export function openIssueSheet(issue: Issue) {
  selectedIssue.set(issue);
  isIssueSheetOpen.set(true);
}

/**
 * Helper function to open issue sheet in create mode (no selected issue)
 */
export function openCreateIssueSheet() {
  selectedIssue.set(null);
  isIssueSheetOpen.set(true);
}

/**
 * Helper function to close issue sheet
 */
export function closeIssueSheet() {
  isIssueSheetOpen.set(false);
  // Delay clearing selected issue for animation
  setTimeout(() => selectedIssue.set(null), 300);
}

/**
 * Helper function to open project sheet in create mode
 */
export function openCreateProjectSheet() {
  projectSheetOpen.set(true);
}

/**
 * Helper function to close project sheet
 */
export function closeProjectSheet() {
  projectSheetOpen.set(false);
}

/**
 * Nav search open state — shared between NavSearch and BottomNav
 */
export const navSearchOpen: Writable<boolean> = writable(false);

/**
 * Helper function to update an issue in the store
 */
export function updateIssue(updatedIssue: Issue) {
  issues.update((items) =>
    items.map((item) => (item.id === updatedIssue.id ? updatedIssue : item)),
  );
}

/**
 * Helper function to add an issue to the store
 */
export function addIssue(newIssue: Issue) {
  issues.update((items) => [...items, newIssue]);
}

/**
 * Helper function to remove an issue from the store
 */
export function removeIssue(issueId: string) {
  issues.update((items) => items.filter((item) => item.id !== issueId));
}
