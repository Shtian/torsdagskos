import { test, expect } from './fixtures';
import {
  cleanupTestData,
  createTestEvent,
  createTestRsvp,
  createTestUser,
  uniqueEmail,
} from './helpers/api-helpers';

async function ensureAuthenticatedUserInDatabase(page: import('@playwright/test').Page): Promise<number> {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await page.goto('/');

    const authInfo = await page.evaluate(async () => {
      const response = await fetch('/api/test/current-user');
      const contentType = response.headers.get('content-type') || '';
      const payload = contentType.includes('application/json')
        ? await response.json().catch(() => null)
        : null;

      if (response.ok && payload?.id && payload?.clerkUserId) {
        return {
          kind: 'existing' as const,
          userId: payload.id as number,
        };
      }

      if (response.status === 404 && payload?.userId) {
        return {
          kind: 'missing' as const,
          clerkUserId: payload.userId as string,
        };
      }

      if (response.status === 401) {
        return { kind: 'retry' as const };
      }

      throw new Error(`Unexpected response from /api/test/current-user: ${response.status}`);
    });

    if (authInfo.kind === 'retry') {
      await page.waitForTimeout(250 * attempt);
      continue;
    }

    if (authInfo.kind === 'existing') {
      return authInfo.userId;
    }

    const createdUser = await createTestUser({
      clerkUserId: authInfo.clerkUserId,
      email: uniqueEmail(),
      name: 'History UI Test User',
    });

    return createdUser.id;
  }

  throw new Error('Unable to resolve authenticated test user after retries.');
}

test.describe('History UI migration', () => {
  test('renders migrated shell and list surfaces for populated history', async ({ page }) => {
    await cleanupTestData();
    const currentUserId = await ensureAuthenticatedUserInDatabase(page);

    const newestEvent = await createTestEvent({
      title: 'Newest History UI Event',
      description: 'Newest item',
      dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      location: 'Newest Venue',
    });

    const olderEvent = await createTestEvent({
      title: 'Older History UI Event',
      description: 'Older item',
      dateTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
      location: 'Older Venue',
    });

    await createTestRsvp({
      userId: currentUserId,
      eventId: newestEvent.id,
      status: 'going',
    });

    await createTestRsvp({
      userId: currentUserId,
      eventId: olderEvent.id,
      status: 'not_going',
    });

    await page.goto('/history');

    await expect(page.getByTestId('history-shell')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Min svarhistorikk', level: 1 })).toBeVisible();
    await expect(page.locator('[data-slot="card"]')).toHaveCount(3);

    const historyItems = page.getByTestId('history-item');
    await expect(historyItems).toHaveCount(2);

    await expect(historyItems.nth(0).getByRole('heading', { name: 'Newest History UI Event', level: 2 })).toBeVisible();
    await expect(historyItems.nth(0).getByTestId('history-status')).toHaveText('Kommer');

    await expect(historyItems.nth(1).getByRole('heading', { name: 'Older History UI Event', level: 2 })).toBeVisible();
    await expect(historyItems.nth(1).getByTestId('history-status')).toHaveText('Kommer ikke');
  });

  test('renders migrated empty-state surface when there are no Svar', async ({ page }) => {
    await cleanupTestData();
    await ensureAuthenticatedUserInDatabase(page);

    await page.goto('/history');

    await expect(page.getByTestId('history-empty-state')).toBeVisible();
    await expect(page.getByTestId('history-empty-state')).toContainText("Du har ikke svart på noen arrangementer ennå.");
    await expect(page.getByTestId('history-item')).toHaveCount(0);
  });

  test('has no horizontal overflow on mobile viewport', async ({ page }) => {
    await cleanupTestData();
    await ensureAuthenticatedUserInDatabase(page);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/history');

    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasOverflow).toBe(false);
  });
});
