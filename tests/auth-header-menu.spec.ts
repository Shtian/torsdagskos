import { test, expect } from './fixtures';

test.describe('Header profile menu - authenticated state', () => {
  test.use({ storageState: './playwright/.clerk/user.json' });

  test('shows profile dropdown items in required order', async ({ page }) => {
    await page.goto('/');

    const accountButton = page.getByRole('button', { name: 'Account' });
    await expect(accountButton).toBeVisible();
    await accountButton.focus();
    await accountButton.press('Enter');

    const menuItems = page.getByRole('menuitem');
    await expect(menuItems).toHaveCount(3);
    await expect(
      page.getByRole('menuitem', { name: 'Profile' }),
    ).toHaveAttribute('href', '/profile');
    await expect(
      page.getByRole('menuitem', { name: 'Settings' }),
    ).toHaveAttribute('href', '/settings');

    const itemText = (await menuItems.allTextContents()).map((item) =>
      item.trim(),
    );
    expect(itemText).toEqual(['Profile', 'Settings', 'Log out']);
  });

  test('supports Space and Escape keyboard interactions', async ({ page }) => {
    await page.goto('/');

    const accountButton = page.getByRole('button', { name: 'Account' });
    await accountButton.focus();
    await accountButton.press('Space');

    const profileItem = page.getByRole('menuitem', { name: 'Profile' });
    await expect(profileItem).toBeVisible();
    await profileItem.focus();
    await page.keyboard.press('Escape');

    await expect(profileItem).not.toBeVisible();
    await expect(accountButton).toBeFocused();
  });

  test('renders log out action in authenticated profile menu', async ({
    page,
  }) => {
    await page.goto('/');

    const accountButton = page.getByRole('button', { name: 'Account' });
    await accountButton.click();
    const logoutItem = page.getByRole('menuitem', { name: 'Log out' });
    await expect(logoutItem).toBeVisible();
    await expect(logoutItem).toHaveAttribute('type', 'button');
  });
});

test.describe('Header profile menu - logged-out state @unauth', () => {
  test('shows only Login action in header when logged out', async ({
    page,
  }) => {
    await page.goto('/access-denied');

    const header = page.getByRole('banner');
    await expect(header.getByRole('link', { name: 'Login' })).toHaveAttribute(
      'href',
      '/sign-in',
    );
    await expect(
      header.getByRole('navigation', { name: 'Hovednavigasjon' }),
    ).toHaveCount(0);
    await expect(header.getByRole('button', { name: 'Account' })).toHaveCount(
      0,
    );
  });
});
