import { test, expect } from './fixtures';

/**
 * E2E tests for authentication flows
 *
 * These tests verify Clerk authentication integration:
 * - Protected route access control
 * - Sign-in and sign-up page accessibility
 * - Authentication redirects
 * - Authenticated user access
 *
 * Setup Requirements:
 * 1. Create a test user in your Clerk dashboard (https://dashboard.clerk.com)
 * 2. Add credentials to .env file:
 *    - E2E_CLERK_USER_USERNAME=test+clerk_test@example.com
 *    - E2E_CLERK_USER_PASSWORD=YourSecurePassword123!
 * 3. Ensure the test user is verified and active
 *
 * Run with: pnpm test tests/auth.spec.ts
 */

test.describe('Authentication - Unauthenticated access @unauth', () => {
  test('homepage redirects unauthenticated users to Clerk sign-in', async ({ page }) => {
    // Attempt to visit the homepage without authentication
    await page.goto('/');

    // Should redirect to Clerk's sign-in page
    // Clerk uses accounts.dev subdomain for hosted auth UI
    await expect(page).toHaveURL(/accounts\.dev.*sign-in/);
  });

  test('sign-in page is accessible and displays Clerk sign-in UI', async ({ page }) => {
    await page.goto('/sign-in');

    // Should load successfully
    await expect(page).toHaveTitle(/Torsdagskos/);

    // Should display Clerk sign-in form heading
    // Use more specific locator to avoid multiple matches
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  });

  test('sign-up page is accessible and displays Clerk sign-up UI', async ({ page }) => {
    await page.goto('/sign-up');

    // Should load successfully
    await expect(page).toHaveTitle(/Torsdagskos/);

    // Should display Clerk sign-up form heading
    await expect(page.getByRole('heading', { name: /create.*account|sign up/i })).toBeVisible();
  });

  test('protected event routes redirect to sign-in', async ({ page }) => {
    // Try to access a protected event detail page
    await page.goto('/events/1');

    // Should redirect to Clerk's sign-in page
    await expect(page).toHaveURL(/accounts\.dev.*sign-in/);
  });
});

test.describe('Authentication - Authenticated access', () => {
  // Use authenticated storage state for these tests
  test.use({ storageState: './playwright/.clerk/user.json' });

  test('authenticated user can access homepage without redirect', async ({ page }) => {
    // Navigate to homepage with authenticated session
    await page.goto('/');

    // Should remain on homepage, not redirect to sign-in
    await expect(page).toHaveURL('/');
    await expect(page).toHaveTitle(/Torsdagskos/);
  });

  test('authenticated user can access protected event routes', async ({ page }) => {
    // Navigate to a protected event detail page
    await page.goto('/events/1');

    // Should remain on the event page, not redirect to sign-in
    // Note: This will 404 if event doesn't exist, but won't redirect to auth
    await expect(page).toHaveURL(/\/events\/1/);
  });

  test('authenticated user is redirected from sign-in page to homepage', async ({ page }) => {
    // Try to access sign-in page when already authenticated
    await page.goto('/sign-in');

    // Clerk should redirect authenticated users away from sign-in
    // They typically redirect to the homepage or afterSignInUrl
    await page.waitForURL('/', { timeout: 5000 });
    await expect(page).toHaveURL('/');
  });

  test('authenticated user is redirected from sign-up page to homepage', async ({ page }) => {
    // Try to access sign-up page when already authenticated
    await page.goto('/sign-up');

    // Clerk should redirect authenticated users away from sign-up
    // They typically redirect to the homepage or afterSignUpUrl
    await page.waitForURL('/', { timeout: 5000 });
    await expect(page).toHaveURL('/');
  });

  test('authenticated user can see user button component', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');

    // Look for Clerk's UserButton component which shows user profile
    // This typically renders as a button with the user's avatar
    const userButton = page.locator('[data-clerk-element="userButton"]').first();
    await expect(userButton).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Authentication - Sign out flow', () => {
  // Use authenticated storage state for these tests
  test.use({ storageState: './playwright/.clerk/user.json' });

  test('sign-out functionality redirects to sign-in', async ({ page }) => {
    await page.goto('/');

    // Wait for user button to be visible
    const userButton = page.locator('[data-clerk-element="userButton"]').first();
    await expect(userButton).toBeVisible({ timeout: 10000 });

    // Click user button to open menu
    await userButton.click();

    // Wait for menu to appear and click sign out
    // Clerk's UserButton menu contains a "Sign out" option
    const signOutButton = page.locator('button:has-text("Sign out"), [data-clerk-element="userButtonTrigger"]:has-text("Sign out")').first();
    await expect(signOutButton).toBeVisible({ timeout: 5000 });
    await signOutButton.click();

    // After sign out, should redirect to sign-in page
    await expect(page).toHaveURL(/sign-in/, { timeout: 10000 });
  });
});
