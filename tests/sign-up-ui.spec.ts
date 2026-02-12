import { test, expect } from './fixtures';

test.describe('Sign-up wrapper UI @unauth', () => {
  test('renders migrated shell with Clerk sign-up intact', async ({ page }) => {
    await page.goto('/sign-up');

    await expect(page).toHaveTitle(/Registrer deg - Torsdagskos/);
    await expect(page.getByTestId('sign-up-shell')).toBeVisible();
    await expect(page.getByTestId('sign-up-kicker')).toHaveText('Bli med i Torsdagskos');
    await expect(page.getByRole('heading', { name: 'Opprett kontoen din', level: 1 })).toBeVisible();
    await expect(page.getByTestId('sign-up-description')).toContainText('Bruk invitasjonen din');

    await expect(page.getByRole('heading', { name: /opprett kontoen din|registrer deg/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Har du allerede en konto? Gå til innlogging' })).toHaveAttribute(
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
