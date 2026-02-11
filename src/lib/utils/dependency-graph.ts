/**
 * Dependency Graph Utilities
 *
 * Handles cycle detection and topological sorting for issue dependencies.
 *
 * Requirements from CLAUDE.md:
 * - Prevent circular dependencies
 * - Use PostgreSQL recursive CTE for server-side validation
 * - Client-side: topological sort for visualization
 */

import type { Issue, Dependency } from '$lib/types';

/**
 * Build adjacency list from dependencies
 *
 * Returns a map of issue_id -> list of depends_on_issue_ids
 */
function buildAdjacencyList(dependencies: Dependency[]): Map<string, string[]> {
	const graph = new Map<string, string[]>();

	for (const dep of dependencies) {
		const current = graph.get(dep.issue_id) || [];
		current.push(dep.depends_on_issue_id);
		graph.set(dep.issue_id, current);
	}

	return graph;
}

/**
 * Check if adding a dependency would create a cycle
 *
 * Client-side cycle detection using DFS.
 * Note: Server-side validation via PostgreSQL function is authoritative.
 *
 * @param issueId - The issue that will depend on another
 * @param dependsOnId - The issue being depended upon
 * @param existingDependencies - Current dependency graph
 * @returns true if adding would create a cycle
 */
export function wouldCreateCycle(
	issueId: string,
	dependsOnId: string,
	existingDependencies: Dependency[]
): boolean {
	// Self-dependency is a cycle
	if (issueId === dependsOnId) {
		return true;
	}

	const graph = buildAdjacencyList(existingDependencies);

	// Add the proposed edge temporarily
	const current = graph.get(issueId) || [];
	graph.set(issueId, [...current, dependsOnId]);

	// DFS to detect cycle
	const visited = new Set<string>();
	const recursionStack = new Set<string>();

	function hasCycle(nodeId: string): boolean {
		if (recursionStack.has(nodeId)) {
			return true; // Cycle detected
		}
		if (visited.has(nodeId)) {
			return false; // Already processed this path
		}

		visited.add(nodeId);
		recursionStack.add(nodeId);

		const neighbors = graph.get(nodeId) || [];
		for (const neighbor of neighbors) {
			if (hasCycle(neighbor)) {
				return true;
			}
		}

		recursionStack.delete(nodeId);
		return false;
	}

	return hasCycle(issueId);
}

/**
 * Get the dependency path from one issue to another
 *
 * Returns the path if one exists, null otherwise.
 * Useful for showing why a dependency would create a cycle.
 */
export function findDependencyPath(
	fromId: string,
	toId: string,
	dependencies: Dependency[]
): string[] | null {
	const graph = buildAdjacencyList(dependencies);
	const visited = new Set<string>();
	const path: string[] = [];

	function dfs(nodeId: string): boolean {
		if (nodeId === toId) {
			path.push(nodeId);
			return true;
		}

		if (visited.has(nodeId)) {
			return false;
		}

		visited.add(nodeId);
		path.push(nodeId);

		const neighbors = graph.get(nodeId) || [];
		for (const neighbor of neighbors) {
			if (dfs(neighbor)) {
				return true;
			}
		}

		path.pop();
		return false;
	}

	const found = dfs(fromId);
	return found ? path : null;
}

/**
 * Topological sort of issues based on dependencies
 *
 * Returns issues in dependency order (dependencies first).
 * If a cycle exists, returns null.
 *
 * Useful for:
 * - Determining work order
 * - Visualizing dependency graph
 */
export function topologicalSort(issues: Issue[], dependencies: Dependency[]): Issue[] | null {
	const graph = buildAdjacencyList(dependencies);
	const inDegree = new Map<string, number>();
	const issueMap = new Map<string, Issue>();

	// Initialize
	for (const issue of issues) {
		issueMap.set(issue.id, issue);
		inDegree.set(issue.id, 0);
	}

	// Calculate in-degrees
	for (const dep of dependencies) {
		const current = inDegree.get(dep.issue_id) || 0;
		inDegree.set(dep.issue_id, current + 1);
	}

	// Queue of issues with no dependencies
	const queue: string[] = [];
	for (const [issueId, degree] of inDegree.entries()) {
		if (degree === 0) {
			queue.push(issueId);
		}
	}

	const sorted: Issue[] = [];

	while (queue.length > 0) {
		const issueId = queue.shift()!;
		const issue = issueMap.get(issueId);
		if (issue) {
			sorted.push(issue);
		}

		// Reduce in-degree for neighbors
		const neighbors = graph.get(issueId) || [];
		for (const neighborId of neighbors) {
			const degree = inDegree.get(neighborId)! - 1;
			inDegree.set(neighborId, degree);
			if (degree === 0) {
				queue.push(neighborId);
			}
		}
	}

	// If sorted length < issues length, there's a cycle
	if (sorted.length < issues.length) {
		return null; // Cycle detected
	}

	return sorted;
}

/**
 * Get all issues that depend on a given issue (blockers)
 *
 * Returns issues that would be affected if the given issue is blocked
 */
export function getBlockedIssues(issueId: string, dependencies: Dependency[]): string[] {
	return dependencies.filter((dep) => dep.depends_on_issue_id === issueId).map((dep) => dep.issue_id);
}

/**
 * Get the transitive closure of dependencies
 *
 * Returns all issues that transitively depend on the given issue
 */
export function getTransitiveDependencies(
	issueId: string,
	dependencies: Dependency[]
): Set<string> {
	const graph = buildAdjacencyList(dependencies);
	const result = new Set<string>();

	function dfs(nodeId: string) {
		const neighbors = graph.get(nodeId) || [];
		for (const neighbor of neighbors) {
			if (!result.has(neighbor)) {
				result.add(neighbor);
				dfs(neighbor);
			}
		}
	}

	dfs(issueId);
	return result;
}
