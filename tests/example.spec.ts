/**
 * Example E2E Test
 *
 * Basic test to verify setup is working.
 * Add more tests as features are implemented.
 */

import { expect, test } from '@playwright/test';

test('home page redirects to login when not authenticated', async ({ page }) => {
	await page.goto('/');
	await expect(page).toHaveURL(/\/auth\/login/);
});

test('login page loads', async ({ page }) => {
	await page.goto('/auth/login');
	await expect(page.locator('h1')).toContainText('Sign In');
});

test('signup page loads', async ({ page }) => {
	await page.goto('/auth/signup');
	await expect(page.locator('h1')).toContainText('Create Account');
});

// TODO: Add tests for authentication flow
// TODO: Add tests for issue CRUD operations
// TODO: Add tests for dependency management
// TODO: Add tests for mobile responsiveness
