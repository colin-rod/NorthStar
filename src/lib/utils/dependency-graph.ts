/**
 * Dependency Graph Utilities
 *
 * Handles topological sorting and dependency analysis for issue dependencies.
 *
 * Note: Cycle detection is handled server-side via PostgreSQL check_dependency_cycle() function.
 * Client-side functions focus on visualization and dependency analysis.
 */

import type { Issue, Dependency } from '$lib/types';

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
  const inDegree = new Map<string, number>();
  const issueMap = new Map<string, Issue>();

  // Build reverse graph: maps each issue to the list of issues that depend on it
  const reverseGraph = new Map<string, string[]>();

  // Initialize
  for (const issue of issues) {
    issueMap.set(issue.id, issue);
    inDegree.set(issue.id, 0);
    reverseGraph.set(issue.id, []);
  }

  // Calculate in-degrees and build reverse graph
  for (const dep of dependencies) {
    const current = inDegree.get(dep.issue_id) || 0;
    inDegree.set(dep.issue_id, current + 1);

    // Build reverse edge: depends_on_issue -> issue
    const blockedIssues = reverseGraph.get(dep.depends_on_issue_id) || [];
    blockedIssues.push(dep.issue_id);
    reverseGraph.set(dep.depends_on_issue_id, blockedIssues);
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
    const issueId = queue.shift();
    if (!issueId) continue;

    const issue = issueMap.get(issueId);
    if (issue) {
      sorted.push(issue);
    }

    // Reduce in-degree for issues that depend on this one
    const blockedIssues = reverseGraph.get(issueId) || [];
    for (const blockedIssueId of blockedIssues) {
      const currentDegree = inDegree.get(blockedIssueId);
      if (currentDegree === undefined) continue;

      const degree = currentDegree - 1;
      inDegree.set(blockedIssueId, degree);
      if (degree === 0) {
        queue.push(blockedIssueId);
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
  return dependencies
    .filter((dep) => dep.depends_on_issue_id === issueId)
    .map((dep) => dep.issue_id);
}

/**
 * Get the transitive closure of dependencies
 *
 * Returns all issues that transitively depend on the given issue
 */
export function getTransitiveDependencies(
  issueId: string,
  dependencies: Dependency[],
): Set<string> {
  // Build adjacency list: issue_id -> list of depends_on_issue_ids
  const graph = new Map<string, string[]>();
  for (const dep of dependencies) {
    const current = graph.get(dep.issue_id) || [];
    current.push(dep.depends_on_issue_id);
    graph.set(dep.issue_id, current);
  }

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
