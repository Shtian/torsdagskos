import { test, expect } from './fixtures';

test.describe('Sign-in wrapper UI @unauth', () => {
  test('renders migrated shell with Clerk sign-in intact', async ({ page }) => {
    await page.goto('/sign-in');

    await expect(page).toHaveTitle(/Logg inn - Torsdagskos/);
    await expect(page.getByTestId('sign-in-shell')).toBeVisible();
    await expect(page.getByTestId('sign-in-kicker')).toHaveText('Velkommen tilbake');
    await expect(page.getByRole('heading', { name: 'Logg inn på Torsdagskos', level: 1 })).toBeVisible();
    await expect(page.getByTestId('sign-in-description')).toContainText('Bruk den inviterte kontoen din');

    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Trenger du en konto? Gå til registrering' })).toHaveAttribute('href', '/sign-up');
  });

  test('keeps mobile layout free of horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/sign-in');

    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasOverflow).toBeFalsy();
  });
});
