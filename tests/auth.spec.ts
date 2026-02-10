import { test, expect } from './fixtures';

/**
 * E2E tests for authentication flows
 *
 * These tests verify Clerk authentication integration:
 * - Protected route access control
 * - Sign-in and sign-up page accessibility
 * - Authentication redirects
 *
 * Note: Tests using Clerk's hosted UI (routing="path") cannot test
 * actual sign-in/sign-up flows without manual interaction, as Clerk
 * redirects to accounts.dev for authentication. These flows are best
 * tested manually or with Clerk's embeddable components.
 *
 * Run with: pnpm test tests/auth.spec.ts
 */

test.describe('Authentication - Unauthenticated access', () => {
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

test.describe('Authentication - Manual flow tests', () => {
  /**
   * The following tests are skipped because they require manual interaction
   * with Clerk's hosted authentication UI.
   *
   * To test these scenarios manually:
   * 1. Run: pnpm dev
   * 2. Navigate to http://localhost:4321
   * 3. Test credentials: test+clerk_test@example.com / TorsdagsKos123!
   * 4. Verification code (if needed): 424242
   *
   * Test checklist:
   * - [ ] Sign in with valid credentials redirects to homepage
   * - [ ] Sign in with invalid credentials shows error
   * - [ ] Sign up with new account creates user
   * - [ ] Authenticated user can see "Sign Out" button
   * - [ ] Authenticated user redirected from /sign-in to /
   * - [ ] Authenticated user redirected from /sign-up to /
   * - [ ] Sign out redirects to sign-in page
   * - [ ] After sign out, accessing / redirects to sign-in
   */

  test.skip('successful sign-in with valid credentials', async () => {
    // Manual test only - requires Clerk hosted UI interaction
  });

  test.skip('sign-in with invalid credentials shows error', async () => {
    // Manual test only - requires Clerk hosted UI interaction
  });

  test.skip('sign-up with new user account', async () => {
    // Manual test only - requires unique email and Clerk hosted UI interaction
  });

  test.skip('authenticated user is redirected from sign-in to homepage', async () => {
    // Manual test only - requires authenticated session
  });

  test.skip('authenticated user is redirected from sign-up to homepage', async () => {
    // Manual test only - requires authenticated session
  });

  test.skip('sign-out functionality works correctly', async () => {
    // Manual test only - requires authenticated session
  });

  test.skip('accessing protected route after sign-out redirects to sign-in', async () => {
    // Manual test only - requires sign-out action
  });
});
