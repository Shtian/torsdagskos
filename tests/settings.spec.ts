import { test, expect } from './fixtures';

async function waitForSettingsNotificationsHydration(
  page: import('@playwright/test').Page,
) {
  await expect(
    page.locator('[data-settings-notifications="true"][data-hydrated="true"]'),
  ).toBeVisible();
}

test.describe('Innstillinger page', () => {
  test.use({ storageState: './playwright/.clerk/user.json' });

  test('shows settings link in header and navigates to settings page', async ({
    page,
  }) => {
    await page.goto('/');

    const settingsLink = page.getByRole('link', { name: 'Innstillinger' });
    await expect(settingsLink).toBeVisible();

    await settingsLink.click();
    await expect(page).toHaveURL('/settings');
    await expect(
      page.getByRole('heading', { name: 'Innstillinger', level: 1 }),
    ).toBeVisible();
  });

  test('shows current browser permission status', async ({ page }) => {
    await page.addInitScript(() => {
      let permissionState = 'default';

      const MockNotification = {
        get permission() {
          return permissionState;
        },

        async requestPermission() {
          permissionState = 'granted';
          return permissionState;
        },
      };

      Object.defineProperty(window, 'Notification', {
        configurable: true,
        writable: true,
        value: MockNotification,
      });
    });

    await page.goto('/settings');
    await waitForSettingsNotificationsHydration(page);
    await expect(page.locator('#permission-status')).toHaveText('Standard');
  });

  test('requests permission and stores enabled preference', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      let permissionState = 'default';

      const MockNotification = {
        get permission() {
          return permissionState;
        },

        async requestPermission() {
          permissionState = 'granted';
          return permissionState;
        },
      };

      Object.defineProperty(window, 'Notification', {
        configurable: true,
        writable: true,
        value: MockNotification,
      });
    });

    await page.goto('/settings');
    await waitForSettingsNotificationsHydration(page);

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes('/api/settings/notifications') &&
          response.request().method() === 'POST',
      ),
      page.getByRole('button', { name: /be om varslingstillatelse/i }).click(),
    ]);

    await expect(page.locator('#permission-status')).toHaveText('Tillatt');
    await expect(page.locator('#saved-preference')).toHaveText('Aktivert');
    await expect(page.locator('#feedback')).toHaveText(
      'Nettleslervarsler aktivert.',
    );

    const currentUser = await page.evaluate(async () => {
      const response = await fetch('/api/test/current-user');
      if (!response.ok) {
        throw new Error('Failed to fetch current user');
      }

      return response.json();
    });

    expect(currentUser.browserNotificationsEnabled).toBe(true);
  });

  test('stores disabled preference when permission is denied', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      let permissionState = 'default';

      const MockNotification = {
        get permission() {
          return permissionState;
        },

        async requestPermission() {
          permissionState = 'denied';
          return permissionState;
        },
      };

      Object.defineProperty(window, 'Notification', {
        configurable: true,
        writable: true,
        value: MockNotification,
      });
    });

    await page.goto('/settings');
    await waitForSettingsNotificationsHydration(page);

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes('/api/settings/notifications') &&
          response.request().method() === 'POST',
      ),
      page.getByRole('button', { name: /be om varslingstillatelse/i }).click(),
    ]);

    await expect(page.locator('#permission-status')).toHaveText('Avvist');
    await expect(page.locator('#saved-preference')).toHaveText('Deaktivert');
    await expect(page.locator('#feedback')).toHaveText(
      'Nettleslervarsler er deaktivert i denne nettleseren.',
    );

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
