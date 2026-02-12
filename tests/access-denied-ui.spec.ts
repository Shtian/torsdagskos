import { test, expect } from './fixtures';

test.describe('Access denied UI @unauth', () => {
  test('renders migrated shell with unchanged status and sign-in action', async ({ page }) => {
    await page.goto('/access-denied');

    await expect(page).toHaveTitle(/Invite-Only Access - Torsdagskos/);
    await expect(page.getByTestId('access-denied-shell')).toBeVisible();
    await expect(page.getByTestId('access-denied-kicker')).toHaveText('Access Restricted');
    await expect(page.getByRole('heading', { name: 'This is an invite-only application' })).toBeVisible();
    await expect(page.getByTestId('access-denied-message')).toContainText('You need an account invitation to continue.');

    const signInLink = page.getByRole('link', { name: 'Go to Sign In' });
    await expect(signInLink).toHaveAttribute('href', '/sign-in');
  });

  test('shows requested path context when redirected from protected route', async ({ page }) => {
    await page.goto('/access-denied?from=%2Fevents%2F1');

    await expect(page.getByTestId('access-denied-message')).toContainText('You tried to open');
    await expect(page.getByText('/events/1')).toBeVisible();
  });

  test('keeps mobile layout free of horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/access-denied');

    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasOverflow).toBeFalsy();
  });
});
