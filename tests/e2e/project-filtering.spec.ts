/**
 * E2E Tests: Project Filtering on Home Page
 *
 * Tests the multi-select project filter functionality with URL state persistence.
 *
 * Prerequisites:
 * - User must be logged in (handled by global setup or manual login)
 * - Test database must have projects and issues
 */

import { test, expect } from '@playwright/test';

test.describe('Project Filtering', () => {
  // Helper to login if needed (can be replaced with global auth setup)
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/');

    // Check if we're redirected to login
    const currentUrl = page.url();
    if (currentUrl.includes('/auth/login')) {
      // If there's a login form, this test requires manual setup
      // or global auth configuration
      test.skip(true, 'Requires authentication setup');
    }
  });

  test('displays "All Projects" button by default', async ({ page }) => {
    await page.goto('/');

    // Verify filter button exists and shows default text
    const filterButton = page.getByText('All Projects');
    await expect(filterButton).toBeVisible();
  });

  test('opens filter popover when clicked', async ({ page }) => {
    await page.goto('/');

    // Click filter button
    await page.getByText('All Projects').click();

    // Verify popover is visible with search input
    const searchInput = page.getByPlaceholder('Search projects...');
    await expect(searchInput).toBeVisible();
  });

  test('displays project list in popover', async ({ page }) => {
    await page.goto('/');

    // Open filter
    await page.getByText('All Projects').click();

    // Check if projects are listed (at least one should exist)
    const projectItems = page.locator('[data-testid="project-checkbox"]');
    const count = await projectItems.count();

    // Should have at least one project (or skip if no test data)
    if (count === 0) {
      test.skip(true, 'No projects in test database');
    }

    expect(count).toBeGreaterThan(0);
  });

  test('filters projects by search query', async ({ page }) => {
    await page.goto('/');

    // Open filter
    await page.getByText('All Projects').click();

    // Get initial project count
    const initialCount = await page.locator('[data-testid="project-checkbox"]').count();

    if (initialCount < 2) {
      test.skip(true, 'Need at least 2 projects for search test');
    }

    // Get first project name to search for
    const firstProjectName = await page
      .locator('[data-testid="project-checkbox"] span')
      .first()
      .textContent();

    if (!firstProjectName) {
      test.skip(true, 'Could not get project name');
    }

    // TypeScript narrowing: we know firstProjectName is not null after the skip check
    const projectName = firstProjectName!;

    // Search for the first project
    const searchInput = page.getByPlaceholder('Search projects...');
    await searchInput.fill(projectName);

    // Verify filtered results
    const filteredCount = await page.locator('[data-testid="project-checkbox"]').count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // The searched project should still be visible
    await expect(page.getByText(projectName, { exact: false })).toBeVisible();
  });

  test('updates URL when project is selected', async ({ page }) => {
    await page.goto('/');

    // Open filter
    await page.getByText('All Projects').click();

    // Get project count
    const projectCount = await page.locator('[data-testid="project-checkbox"]').count();
    if (projectCount === 0) {
      test.skip(true, 'No projects available');
    }

    // Click first project
    await page.locator('[data-testid="project-checkbox"]').first().click();

    // Wait for navigation
    await page.waitForURL(/\?projects=/);

    // Verify URL contains projects parameter
    const url = page.url();
    expect(url).toContain('projects=');

    // Verify button text updated
    await expect(page.getByText('Projects (1)')).toBeVisible();
  });

  test('filters issues when project is selected', async ({ page }) => {
    await page.goto('/');

    // Get initial issue count (all projects)
    const allIssuesCount = await page.locator('[data-testid="issue-row"]').count();

    if (allIssuesCount === 0) {
      test.skip(true, 'No issues in database');
    }

    // Open filter
    await page.getByText('All Projects').click();

    // Select first project
    await page.locator('[data-testid="project-checkbox"]').first().click();

    // Wait for URL to update
    await page.waitForURL(/\?projects=/);

    // Close popover by clicking outside (optional)
    await page.keyboard.press('Escape');

    // Get filtered issue count
    const filteredIssuesCount = await page.locator('[data-testid="issue-row"]').count();

    // Filtered count should be less than or equal to total
    expect(filteredIssuesCount).toBeLessThanOrEqual(allIssuesCount);
  });

  test('allows selecting multiple projects', async ({ page }) => {
    await page.goto('/');

    // Open filter
    await page.getByText('All Projects').click();

    const projectCount = await page.locator('[data-testid="project-checkbox"]').count();
    if (projectCount < 2) {
      test.skip(true, 'Need at least 2 projects');
    }

    // Select first project
    await page.locator('[data-testid="project-checkbox"]').first().click();
    await expect(page.getByText('Projects (1)')).toBeVisible();

    // Select second project (popover should still be open)
    await page.locator('[data-testid="project-checkbox"]').nth(1).click();

    // Verify button shows count of 2
    await expect(page.getByText('Projects (2)')).toBeVisible();

    // Verify URL has multiple project IDs
    const url = page.url();
    expect(url).toContain('projects=');
    expect(url.split('projects=')[1]).toContain(',');
  });

  test('browser back button restores previous filter state', async ({ page }) => {
    await page.goto('/');

    // Verify starting state
    await expect(page.getByText('All Projects')).toBeVisible();

    // Open filter and select a project
    await page.getByText('All Projects').click();

    const projectCount = await page.locator('[data-testid="project-checkbox"]').count();
    if (projectCount === 0) {
      test.skip(true, 'No projects available');
    }

    await page.locator('[data-testid="project-checkbox"]').first().click();

    // Wait for filter to apply
    await expect(page.getByText('Projects (1)')).toBeVisible();

    // Go back
    await page.goBack();

    // Should show all projects again
    await expect(page.getByText('All Projects')).toBeVisible();
    expect(page.url()).not.toContain('projects=');
  });

  test('browser forward button reapplies filter', async ({ page }) => {
    await page.goto('/');

    // Select a project
    await page.getByText('All Projects').click();

    const projectCount = await page.locator('[data-testid="project-checkbox"]').count();
    if (projectCount === 0) {
      test.skip(true, 'No projects available');
    }

    await page.locator('[data-testid="project-checkbox"]').first().click();
    await expect(page.getByText('Projects (1)')).toBeVisible();

    // Go back
    await page.goBack();
    await expect(page.getByText('All Projects')).toBeVisible();

    // Go forward
    await page.goForward();

    // Should restore filtered state
    await expect(page.getByText('Projects (1)')).toBeVisible();
    expect(page.url()).toContain('projects=');
  });

  test('filter persists across tab switches', async ({ page }) => {
    await page.goto('/');

    // Select a project
    await page.getByText('All Projects').click();

    const projectCount = await page.locator('[data-testid="project-checkbox"]').count();
    if (projectCount === 0) {
      test.skip(true, 'No projects available');
    }

    await page.locator('[data-testid="project-checkbox"]').first().click();
    await page.keyboard.press('Escape');

    // Verify filter is applied
    await expect(page.getByText('Projects (1)')).toBeVisible();

    // Switch to "Doing" tab
    await page.getByRole('tab', { name: /Doing/i }).click();

    // Filter button should still show selected project
    await expect(page.getByText('Projects (1)')).toBeVisible();

    // URL should still have projects parameter
    expect(page.url()).toContain('projects=');

    // Switch to "Blocked" tab
    await page.getByRole('tab', { name: /Blocked/i }).click();

    // Filter should still be applied
    await expect(page.getByText('Projects (1)')).toBeVisible();
  });

  test('shows "No projects found" when search has no matches', async ({ page }) => {
    await page.goto('/');

    // Open filter
    await page.getByText('All Projects').click();

    // Search for non-existent project
    const searchInput = page.getByPlaceholder('Search projects...');
    await searchInput.fill('ThisProjectDoesNotExist12345');

    // Should show empty state
    await expect(page.getByText('No projects found')).toBeVisible();
  });

  test('unchecking all projects returns to "All Projects"', async ({ page }) => {
    await page.goto('/');

    // Open filter and select a project
    await page.getByText('All Projects').click();

    const projectCount = await page.locator('[data-testid="project-checkbox"]').count();
    if (projectCount === 0) {
      test.skip(true, 'No projects available');
    }

    // Select first project
    await page.locator('[data-testid="project-checkbox"]').first().click();
    await expect(page.getByText('Projects (1)')).toBeVisible();

    // Uncheck the same project
    await page.locator('[data-testid="project-checkbox"]').first().click();

    // Should return to "All Projects"
    await expect(page.getByText('All Projects')).toBeVisible();

    // URL should not have projects parameter
    expect(page.url()).not.toContain('projects=');
  });
});
