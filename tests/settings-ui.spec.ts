import { test, expect } from './fixtures';

test.describe('Settings UI migration', () => {
  test.use({ storageState: './playwright/.clerk/user.json' });

  test('renders migrated shell and notification status surfaces', async ({ page }) => {
    await page.goto('/settings');

    await expect(page.getByTestId('settings-shell')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Browser Notifications', level: 2 })).toBeVisible();

    await expect(page.locator('[data-slot="card"]')).toHaveCount(1);
    await expect(page.getByTestId('settings-permission-card')).toBeVisible();
    await expect(page.getByTestId('settings-preference-card')).toBeVisible();

    await expect(page.locator('#permission-status')).toHaveText(/checking|default|granted|denied|unsupported/i);
    await expect(page.locator('#saved-preference')).toHaveText(/enabled|disabled/i);
    await expect(page.getByRole('button', { name: /request notification permission/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /back to events/i })).toHaveAttribute('href', '/');
  });

  test('shows migrated inline feedback panel during notification update', async ({ page }) => {
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

    await expect(page.getByTestId('settings-feedback-panel')).toBeVisible();
    await expect(page.locator('#feedback')).toHaveText(/browser notifications enabled/i);
  });

  test('has no horizontal overflow on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/settings');

    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasOverflow).toBe(false);
  });
});
