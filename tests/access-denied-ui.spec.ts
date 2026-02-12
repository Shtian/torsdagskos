import { test, expect } from './fixtures';

test.describe('Access denied UI @unauth', () => {
  test('renders migrated shell with unchanged status and sign-in action', async ({ page }) => {
    await page.goto('/access-denied');

    await expect(page).toHaveTitle(/Kun invitert tilgang - Torsdagskos/);
    await expect(page.getByTestId('access-denied-shell')).toBeVisible();
    await expect(page.getByTestId('access-denied-kicker')).toHaveText('Tilgang begrenset');
    await expect(page.getByRole('heading', { name: 'Dette er en app kun for inviterte' })).toBeVisible();
    await expect(page.getByTestId('access-denied-message')).toContainText('Du trenger en kontoinvitasjon for å fortsette.');

    const signInLink = page.getByRole('link', { name: 'Gå til innlogging' });
    await expect(signInLink).toHaveAttribute('href', '/sign-in');
  });

  test('shows requested path context when redirected from protected route', async ({ page }) => {
    await page.goto('/access-denied?from=%2Fevents%2F1');

    await expect(page.getByTestId('access-denied-message')).toContainText('Du prøvde å åpne');
    await expect(page.getByText('/events/1')).toBeVisible();
  });

  test('keeps mobile layout free of horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/access-denied');

    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasOverflow).toBeFalsy();
  });
});
