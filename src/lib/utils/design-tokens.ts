/**
 * North Design System - Design Tokens & Utilities
 *
 * Centralized design tokens and helper functions for the North design system.
 * This file provides reusable values and functions for consistent styling
 * across the application.
 */

/**
 * Status Colors
 * Maps issue status to corresponding status color classes
 */
export const statusColors = {
	todo: 'status-todo',
	doing: 'status-doing',
	in_review: 'status-in-review',
	done: 'status-done',
	blocked: 'status-blocked',
	canceled: 'status-canceled'
} as const;

export type IssueStatus = keyof typeof statusColors;

/**
 * Get status color class for a given status
 */
export function getStatusColor(status: string): string {
	return statusColors[status as IssueStatus] || statusColors.todo;
}

/**
 * Get status dot background class (for small colored dots)
 */
export function getStatusDotClass(status: string): string {
	return `bg-${getStatusColor(status)}`;
}

/**
 * Badge variant mapping for status
 */
export function getStatusBadgeVariant(
	status: string
): 'status-todo' | 'status-doing' | 'status-in-review' | 'status-done' | 'status-blocked' | 'status-canceled' {
	const variants = {
		todo: 'status-todo',
		doing: 'status-doing',
		in_review: 'status-in-review',
		done: 'status-done',
		blocked: 'status-blocked',
		canceled: 'status-canceled'
	} as const;

	return variants[status as IssueStatus] || 'status-todo';
}

/**
 * Priority Colors
 * P0 = Highest, P3 = Lowest
 */
export const priorityLabels = {
	0: 'P0',
	1: 'P1',
	2: 'P2',
	3: 'P3'
} as const;

export type Priority = 0 | 1 | 2 | 3;

/**
 * Get priority label for display
 */
export function getPriorityLabel(priority: number): string {
	return priorityLabels[priority as Priority] || 'P3';
}

/**
 * Epic Status
 */
export const epicStatusVariants = {
	active: 'default',
	done: 'status-done',
	canceled: 'status-canceled'
} as const;

export type EpicStatus = keyof typeof epicStatusVariants;

/**
 * Get badge variant for epic status
 */
export function getEpicStatusVariant(status: string): 'default' | 'status-done' | 'status-canceled' {
	return epicStatusVariants[status as EpicStatus] || 'default';
}

/**
 * Spacing Scale (based on 4px grid)
 * Use these values for consistent spacing throughout the app
 */
export const spacing = {
	xs: '4px',
	sm: '8px',
	md: '12px',
	base: '16px',
	lg: '24px',
	xl: '32px',
	'2xl': '48px'
} as const;

/**
 * Border Radius
 * North design system radius values
 */
export const borderRadius = {
	sm: '6px',
	md: '10px',
	lg: '20px' // For drawer tops
} as const;

/**
 * Typography Scale
 * Use these for consistent typography
 */
export const typography = {
	pageTitle: 'text-page-title font-accent',
	sectionHeader: 'text-section-header font-ui',
	issueTitle: 'text-issue-title font-ui',
	body: 'text-body font-ui',
	metadata: 'text-metadata'
} as const;

/**
 * Animation Durations
 * North design: Quick, quiet, predictable
 */
export const duration = {
	fast: '150ms',
	drawer: '250ms',
	slow: '300ms'
} as const;

/**
 * Shadow Levels
 * North design: Two shadow levels only
 */
export const shadows = {
	level1: 'shadow-level-1',
	level2: 'shadow-level-2'
} as const;

/**
 * Check if an issue is blocked
 * TODO: Implement actual dependency checking logic
 */
export function isIssueBlocked(issue: { dependencies?: unknown[] }): boolean {
	// Placeholder implementation
	// Real implementation should check if any dependency has status NOT in ['done', 'canceled']
	return false;
}

/**
 * Check if an issue is ready
 * Ready = status 'todo' AND not blocked
 */
export function isIssueReady(issue: { status: string; dependencies?: unknown[] }): boolean {
	return issue.status === 'todo' && !isIssueBlocked(issue);
}

/**
 * Story Points
 * Valid story point values per North/CLAUDE.md spec
 */
export const validStoryPoints = [1, 2, 3, 5, 8, 13, 21] as const;
export type StoryPoints = typeof validStoryPoints[number];

/**
 * Validate story points
 */
export function isValidStoryPoints(value: number): value is StoryPoints {
	return validStoryPoints.includes(value as StoryPoints);
}
