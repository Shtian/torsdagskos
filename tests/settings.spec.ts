import { test, expect } from './fixtures';

test.describe('Settings page', () => {
  test.use({ storageState: './playwright/.clerk/user.json' });

  test('shows settings link in header and navigates to settings page', async ({ page }) => {
    await page.goto('/');

    const settingsLink = page.getByRole('link', { name: 'Settings' });
    await expect(settingsLink).toBeVisible();

    await settingsLink.click();
    await expect(page).toHaveURL('/settings');
    await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
  });

  test('shows current browser permission status', async ({ page }) => {
    await page.addInitScript(() => {
      let permissionState = 'default';

      class MockNotification {
        static get permission() {
          return permissionState;
        }

        static async requestPermission() {
          permissionState = 'granted';
          return permissionState;
        }
      }

      Object.defineProperty(window, 'Notification', {
        configurable: true,
        writable: true,
        value: MockNotification,
      });
    });

    await page.goto('/settings');
    await expect(page.locator('#permission-status')).toHaveText('Default');
  });

  test('requests permission and stores enabled preference', async ({ page }) => {
    await page.addInitScript(() => {
      let permissionState = 'default';

      class MockNotification {
        static get permission() {
          return permissionState;
        }

        static async requestPermission() {
          permissionState = 'granted';
          return permissionState;
        }
      }

      Object.defineProperty(window, 'Notification', {
        configurable: true,
        writable: true,
        value: MockNotification,
      });
    });

    await page.goto('/settings');

    await Promise.all([
      page.waitForResponse((response) =>
        response.url().includes('/api/settings/notifications') && response.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /request notification permission/i }).click(),
    ]);

    await expect(page.locator('#permission-status')).toHaveText('Granted');
    await expect(page.locator('#saved-preference')).toHaveText('Enabled');
    await expect(page.locator('#feedback')).toHaveText('Browser notifications enabled.');

    const currentUser = await page.evaluate(async () => {
      const response = await fetch('/api/test/current-user');
      if (!response.ok) {
        throw new Error('Failed to fetch current user');
      }

      return response.json();
    });

    expect(currentUser.browserNotificationsEnabled).toBe(true);
  });

  test('stores disabled preference when permission is denied', async ({ page }) => {
    await page.addInitScript(() => {
      let permissionState = 'default';

      class MockNotification {
        static get permission() {
          return permissionState;
        }

        static async requestPermission() {
          permissionState = 'denied';
          return permissionState;
        }
      }

      Object.defineProperty(window, 'Notification', {
        configurable: true,
        writable: true,
        value: MockNotification,
      });
    });

    await page.goto('/settings');

    await Promise.all([
      page.waitForResponse((response) =>
        response.url().includes('/api/settings/notifications') && response.request().method() === 'POST'
      ),
      page.getByRole('button', { name: /request notification permission/i }).click(),
    ]);

    await expect(page.locator('#permission-status')).toHaveText('Denied');
    await expect(page.locator('#saved-preference')).toHaveText('Disabled');
    await expect(page.locator('#feedback')).toHaveText('Browser notifications are disabled for this browser.');

    const currentUser = await page.evaluate(async () => {
      const response = await fetch('/api/test/current-user');
      if (!response.ok) {
        throw new Error('Failed to fetch current user');
      }

      return response.json();
    });

    expect(currentUser.browserNotificationsEnabled).toBe(false);
  });
});
