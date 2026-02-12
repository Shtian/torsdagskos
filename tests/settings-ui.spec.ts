import { test, expect } from './fixtures';

test.describe('Innstillinger UI migration', () => {
  test.use({ storageState: './playwright/.clerk/user.json' });

  test('renders migrated shell and notification status surfaces', async ({
    page,
  }) => {
    await page.goto('/settings');

    await expect(page.getByTestId('settings-shell')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Innstillinger', level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Nettleslervarsler', level: 2 }),
    ).toBeVisible();

    await expect(page.locator('[data-slot="card"]')).toHaveCount(1);
    await expect(page.getByTestId('settings-permission-card')).toBeVisible();
    await expect(page.getByTestId('settings-preference-card')).toBeVisible();

    await expect(page.locator('#permission-status')).toHaveText(
      /sjekker|standard|tillatt|avvist|ikke støttet/i,
    );
    await expect(page.locator('#saved-preference')).toHaveText(
      /aktivert|deaktivert/i,
    );
    await expect(
      page.getByRole('button', { name: /be om varslingstillatelse/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /tilbake til arrangementer/i }),
    ).toHaveAttribute('href', '/');
  });

  test('shows migrated inline feedback panel during notification update', async ({
    page,
  }) => {
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
      page.waitForResponse(
        (response) =>
          response.url().includes('/api/settings/notifications') &&
          response.request().method() === 'POST',
      ),
      page.getByRole('button', { name: /be om varslingstillatelse/i }).click(),
    ]);

    await expect(page.getByTestId('settings-feedback-panel')).toBeVisible();
    await expect(page.locator('#feedback')).toHaveText(
      /nettleslervarsler aktivert/i,
    );
  });

  test('has no horizontal overflow on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/settings');

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasOverflow).toBe(false);
  });
});
