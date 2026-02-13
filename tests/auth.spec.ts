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
  test('homepage redirects unauthenticated users to access denied page', async ({
    page,
  }) => {
    // Attempt to visit the homepage without authentication
    await page.goto('/');

    // Should redirect to custom access denied page
    await expect(page).toHaveURL(/\/access-denied/);
    await expect(
      page.getByRole('heading', { name: 'Dette er en app kun for inviterte' }),
    ).toBeVisible();
  });

  test('sign-in page is accessible and displays Clerk sign-in UI', async ({
    page,
  }) => {
    await page.goto('/sign-in');

    // Should load successfully
    await expect(page).toHaveTitle(/Torsdagskos/);

    // Should display Clerk sign-in form heading
    // Use more specific locator to avoid multiple matches
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  });

  test('sign-up page is accessible and displays Clerk sign-up UI', async ({
    page,
  }) => {
    await page.goto('/sign-up');

    // Should load successfully
    await expect(page).toHaveTitle(/Torsdagskos/);

    // Should display Clerk sign-up form heading
    await expect(
      page.getByRole('heading', { name: /create.*account|sign up/i }),
    ).toBeVisible();
  });

  test('protected event routes redirect to access denied page with sign-in link', async ({
    page,
  }) => {
    // Try to access a protected event detail page
    await page.goto('/events/1');

    // Should redirect to custom access denied page
    await expect(page).toHaveURL(/\/access-denied\?from=%2Fevents%2F1/);
    await expect(
      page.getByRole('heading', { name: 'Dette er en app kun for inviterte' }),
    ).toBeVisible();

    const signInLink = page.getByRole('link', { name: 'Gå til innlogging' });
    await expect(signInLink).toHaveAttribute('href', '/sign-in');

    await signInLink.click();
    await expect(page).toHaveURL('/sign-in');
  });
});

test.describe('Authentication - Authenticated access', () => {
  // Use authenticated storage state for these tests
  test.use({ storageState: './playwright/.clerk/user.json' });

  test('authenticated user can access homepage without redirect', async ({
    page,
  }) => {
    // Navigate to homepage with authenticated session
    await page.goto('/');

    // Should remain on homepage, not redirect to sign-in
    await expect(page).toHaveURL('/');
    await expect(page).toHaveTitle(/Torsdagskos/);
  });

  test('authenticated user can access protected event routes', async ({
    page,
  }) => {
    // Navigate to a protected event detail page
    await page.goto('/events/1');

    // Should remain on the event page, not redirect to sign-in
    // Note: This will 404 if event doesn't exist, but won't redirect to auth
    await expect(page).toHaveURL(/\/events\/1/);
  });

  test('authenticated user is redirected from sign-in page to homepage', async ({
    page,
  }) => {
    // Try to access sign-in page when already authenticated
    await page.goto('/sign-in');

    // Clerk should redirect authenticated users away from sign-in
    // They typically redirect to the homepage or afterSignInUrl
    await page.waitForURL('/', { timeout: 5000 });
    await expect(page).toHaveURL('/');
  });

  test('authenticated user is redirected from sign-up page to homepage', async ({
    page,
  }) => {
    // Try to access sign-up page when already authenticated
    await page.goto('/sign-up');

    // Clerk should redirect authenticated users away from sign-up
    // They typically redirect to the homepage or afterSignUpUrl
    await page.waitForURL('/', { timeout: 5000 });
    await expect(page).toHaveURL('/');
  });

  test('authenticated user can see account menu trigger', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');

    // Our layout renders an Account menu trigger when authenticated
    const accountButton = page.getByRole('button', { name: 'Account' });
    await expect(accountButton).toBeVisible({ timeout: 10000 });
  });
});
