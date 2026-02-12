import { test, expect } from './fixtures';

test.describe('Push notifications', () => {
  test.use({ storageState: './playwright/.clerk/user.json' });

  test('service worker script is available', async ({ page }) => {
    const response = await page.request.get('/service-worker.js');
    expect(response.ok()).toBe(true);

    const body = await response.text();
    expect(body).toContain("self.addEventListener('push'");
    expect(body).toContain("self.addEventListener('notificationclick'");
  });

  test('stores and clears push subscription for authenticated user', async ({
    page,
  }) => {
    await page.goto('/settings');

    const setResult = await page.evaluate(async () => {
      const response = await fetch('/api/settings/push-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: {
            endpoint: 'https://example.invalid/push/test-subscription',
            keys: {
              p256dh: 'mock-p256dh',
              auth: 'mock-auth',
            },
          },
        }),
      });

      return {
        ok: response.ok,
        payload: await response.json(),
      };
    });

    expect(setResult.ok).toBe(true);
    expect(setResult.payload.hasSubscription).toBe(true);

    const userAfterSet = await page.evaluate(async () => {
      const response = await fetch('/api/test/current-user');
      return response.json();
    });

    expect(userAfterSet.pushSubscription).toContain(
      'https://example.invalid/push/test-subscription',
    );

    const clearResult = await page.evaluate(async () => {
      const response = await fetch('/api/settings/push-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscription: null }),
      });

      return {
        ok: response.ok,
        payload: await response.json(),
      };
    });

    expect(clearResult.ok).toBe(true);
    expect(clearResult.payload.hasSubscription).toBe(false);

    const userAfterClear = await page.evaluate(async () => {
      const response = await fetch('/api/test/current-user');
      return response.json();
    });

    expect(userAfterClear.pushSubscription).toBe(null);
  });
});
