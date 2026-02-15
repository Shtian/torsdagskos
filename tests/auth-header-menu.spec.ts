import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

async function openHeaderProfileMenu(page: Page) {
  const accountButton = page.getByRole('button', { name: 'Konto meny' });
  await expect(
    page.locator('[data-header-profile-menu][data-hydrated="true"]'),
  ).toBeVisible();
  await expect(accountButton).toBeVisible();
  await accountButton.focus();
  await accountButton.press('Enter');
}

test.describe('Header profile menu - authenticated state', () => {
  test.use({ storageState: './playwright/.clerk/user.json' });

  test('shows profile dropdown items in required order', async ({ page }) => {
    await page.goto('/');

    await openHeaderProfileMenu(page);

    const menuItems = page.getByRole('menuitem');
    await expect(menuItems).toHaveCount(2);
    await expect(
      page.getByRole('menuitem', { name: 'Profil' }),
    ).toHaveAttribute('href', '/profile');

    const itemText = (await menuItems.allTextContents()).map((item) =>
      item.trim(),
    );
    expect(itemText).toEqual(['Profil', 'Logg ut']);
  });

  test('supports Space and Escape keyboard interactions', async ({ page }) => {
    await page.goto('/');

    const accountButton = page.getByRole('button', { name: 'Konto meny' });
    await expect(
      page.locator('[data-header-profile-menu][data-hydrated="true"]'),
    ).toBeVisible();
    await accountButton.focus();
    await accountButton.press('Space');

    const profileItem = page.getByRole('menuitem', { name: 'Profil' });
    await expect(profileItem).toBeVisible();
    await profileItem.focus();
    await page.keyboard.press('Escape');

    await expect(profileItem).not.toBeVisible();
    await expect(accountButton).toBeFocused();
  });

  test('closes menu when clicking outside the profile menu', async ({ page }) => {
    await page.goto('/');

    const accountButton = page.getByRole('button', { name: 'Konto meny' });
    await expect(
      page.locator('[data-header-profile-menu][data-hydrated="true"]'),
    ).toBeVisible();
    await accountButton.click();

    const profileItem = page.getByRole('menuitem', { name: 'Profil' });
    await expect(profileItem).toBeVisible();

    await page.getByRole('heading', { name: 'Torsdagskos' }).click();
    await expect(profileItem).not.toBeVisible();
  });

  test('renders log out action in authenticated profile menu', async ({
    page,
  }) => {
    await page.goto('/');

    const accountButton = page.getByRole('button', { name: 'Konto meny' });
    await expect(
      page.locator('[data-header-profile-menu][data-hydrated="true"]'),
    ).toBeVisible();
    await accountButton.click();
    const logoutItem = page.getByRole('menuitem', { name: 'Logg ut' });
    await expect(logoutItem).toBeVisible();
    await expect(logoutItem).toHaveAttribute('type', 'button');
  });
});

test.describe('Header profile menu - logged-out state @unauth', () => {
  test('shows only Logg inn action in header when logged out', async ({
    page,
  }) => {
    await page.goto('/access-denied');

    const header = page.getByRole('banner');
    await expect(
      header.getByRole('link', { name: 'Logg inn' }),
    ).toHaveAttribute('href', '/sign-in');
    await expect(
      header.getByRole('navigation', { name: 'Hovednavigasjon' }),
    ).toHaveCount(0);
    await expect(
      header.getByRole('button', { name: 'Konto meny' }),
    ).toHaveCount(0);
  });
});
