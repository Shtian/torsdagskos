import { test, expect } from './fixtures';

/**
 * Smoke tests to verify basic Playwright and Clerk setup
 *
 * These tests ensure that:
 * 1. Playwright can reach the dev server
 * 2. Clerk authentication middleware is working
 * 3. The application responds correctly to unauthenticated requests
 *
 * Run with: pnpm test
 */

test.describe('Smoke tests @unauth', () => {
  test('homepage redirects unauthenticated users to access denied page', async ({ page }) => {
    // Attempt to visit the homepage without authentication
    await page.goto('/');

    // Should redirect to the custom access denied page
    await expect(page).toHaveURL(/\/access-denied/);
    await expect(page.getByRole('heading', { name: 'This is an invite-only application' })).toBeVisible();
  });

  test('sign-in page is accessible', async ({ page }) => {
    // Visit the sign-in page directly
    const response = await page.goto('/sign-in');

    // Should load successfully
    expect(response?.status()).toBe(200);

    // Page should contain Clerk's sign-in UI
    await expect(page).toHaveTitle(/Torsdagskos/);
  });

  test('sign-up page is accessible', async ({ page }) => {
    // Visit the sign-up page directly
    const response = await page.goto('/sign-up');

    // Should load successfully
    expect(response?.status()).toBe(200);

    // Page should contain the app name
    await expect(page).toHaveTitle(/Torsdagskos/);
  });
});
