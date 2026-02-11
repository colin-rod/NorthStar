/**
 * Computed Stores
 *
 * Derived stores for filtered/computed issue states.
 *
 * Requirements from CLAUDE.md:
 * - Ready issues: status = todo AND not blocked
 * - Blocked issues: has dependencies not done/canceled
 */

import { derived, type Readable } from 'svelte/store';
import { issues } from './issues';
import { isBlocked, isReady } from '$lib/utils/issue-helpers';
import type { Issue } from '$lib/types';

/**
 * Ready issues
 *
 * Issues that are:
 * - Status = 'todo'
 * - Not blocked by dependencies
 */
export const readyIssues: Readable<Issue[]> = derived(issues, ($issues) => {
	return $issues.filter(isReady);
});

/**
 * Blocked issues
 *
 * Issues that have at least one dependency not done/canceled
 */
export const blockedIssues: Readable<Issue[]> = derived(issues, ($issues) => {
	return $issues.filter(isBlocked);
});

/**
 * Doing issues
 *
 * Issues currently in progress
 */
export const doingIssues: Readable<Issue[]> = derived(issues, ($issues) => {
	return $issues.filter((issue) => issue.status === 'doing');
});

/**
 * In review issues
 */
export const inReviewIssues: Readable<Issue[]> = derived(issues, ($issues) => {
	return $issues.filter((issue) => issue.status === 'in_review');
});

/**
 * Done issues
 */
export const doneIssues: Readable<Issue[]> = derived(issues, ($issues) => {
	return $issues.filter((issue) => issue.status === 'done');
});

/**
 * Canceled issues
 */
export const canceledIssues: Readable<Issue[]> = derived(issues, ($issues) => {
	return $issues.filter((issue) => issue.status === 'canceled');
});

/**
 * Todo issues (including blocked)
 */
export const todoIssues: Readable<Issue[]> = derived(issues, ($issues) => {
	return $issues.filter((issue) => issue.status === 'todo');
});

/**
 * Issues by priority
 *
 * Returns a map of priority -> issues, sorted by priority (P0 first)
 */
export const issuesByPriority: Readable<Map<number, Issue[]>> = derived(issues, ($issues) => {
	const map = new Map<number, Issue[]>();

	for (const issue of $issues) {
		const priority = issue.priority;
		const existing = map.get(priority) || [];
		existing.push(issue);
		map.set(priority, existing);
	}

	// Sort by priority (P0 first)
	return new Map([...map.entries()].sort(([a], [b]) => a - b));
});

/**
 * Issue counts by status
 *
 * Useful for dashboard stats
 */
export const issueCounts: Readable<{
	ready: number;
	blocked: number;
	doing: number;
	inReview: number;
	done: number;
	canceled: number;
	total: number;
}> = derived(
	[readyIssues, blockedIssues, doingIssues, inReviewIssues, doneIssues, canceledIssues, issues],
	([$ready, $blocked, $doing, $inReview, $done, $canceled, $issues]) => ({
		ready: $ready.length,
		blocked: $blocked.length,
		doing: $doing.length,
		inReview: $inReview.length,
		done: $done.length,
		canceled: $canceled.length,
		total: $issues.length
	})
);
