import { test, expect } from './fixtures';

test.describe('Sign-up wrapper UI @unauth', () => {
  test('renders migrated shell with Clerk sign-up intact', async ({ page }) => {
    await page.goto('/sign-up');

    await expect(page).toHaveTitle(/Sign Up - Torsdagskos/);
    await expect(page.getByTestId('sign-up-shell')).toBeVisible();
    await expect(page.getByTestId('sign-up-kicker')).toHaveText('Join Torsdagskos');
    await expect(page.getByRole('heading', { name: 'Create your account', level: 1 })).toBeVisible();
    await expect(page.getByTestId('sign-up-description')).toContainText('Use your invite');

    await expect(page.getByRole('heading', { name: /create.*account|sign up/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Already have an account? Go to Sign In' })).toHaveAttribute(
      'href',
      '/sign-in'
    );
  });

  test('keeps mobile layout free of horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/sign-up');

    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasOverflow).toBeFalsy();
  });
});
