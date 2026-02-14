import { test, expect } from './fixtures';
import { createTestUser, createTestEvent } from './helpers/api-helpers';
import { gotoWithRetry } from './helpers/navigation-helpers';

/**
 * E2E tests for RSVP functionality
 *
 * These tests verify RSVP interactions:
 * - RSVPing to events (Kommer, Kanskje, Kommer ikke)
 * - Changing RSVP status
 * - RSVP counts updating
 * - tidligere arrangementer cannot be RSVPd to
 * - Current user RSVP status display
 *
 * Run with: pnpm test tests/rsvp.spec.ts
 */

// Helper to generate unique email addresses for test isolation
function uniqueEmail(base: string): string {
  return `${base}+${Date.now()}+${Math.random().toString(36).substring(7)}@example.com`;
}

test.describe('RSVP Functionality', () => {
  // Use authenticated storage state for these tests
  test.use({ storageState: './playwright/.clerk/user.json' });

  // Note: Basic RSVP functionality is thoroughly tested by the tests below
  // This test was removed due to flakiness in parallel execution

  test('should allow user to change RSVP status', async ({ page }) => {
    // Get the authenticated user's Clerk ID and ensure they exist in the database
    await gotoWithRetry(page, '/');
    await page.waitForLoadState('networkidle');

    const clerkUserId = await page.evaluate(async () => {
      const response = await fetch('/api/test/current-user');
      const data = await response.json();
      if (response.status === 404 && data.userId) {
        return data.userId;
      }
      if (response.ok) {
        return data.clerkUserId;
      }
      throw new Error(`Unexpected response: ${response.status}`);
    });

    // Ensure the authenticated user exists in the database
    try {
      await createTestUser({
        clerkUserId,
        email: uniqueEmail('authenticated'),
        name: 'Authenticated Test User',
      });
    } catch (_error) {
      // User already exists, that's fine
    }

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const event = await createTestEvent({
      title: 'Test RSVP Change Event',
      description: 'Test event for changing RSVP',
      dateTime: futureDate,
      location: 'Test Location',
    });

    await gotoWithRetry(page, `/events/${event.id}`);

    // First, RSVP "Kommer"
    const goingButton = page.getByRole('button', {
      name: 'Kommer',
      exact: true,
    });
    await goingButton.click();
    await expect(page.getByTestId('rsvp-feedback-panel')).toContainText(
      'Svar oppdatert',
    );
    await page.waitForLoadState('load');

    // Verify "Kommer" is active
    await expect(goingButton).toBeVisible();
    await expect(goingButton).toHaveAttribute('data-active', 'true');

    // Change to "Kanskje"
    const maybeButton = page.getByRole('button', {
      name: 'Kanskje',
      exact: true,
    });
    await maybeButton.click();
    await expect(page.getByTestId('rsvp-feedback-panel')).toContainText(
      'Svar oppdatert',
    );
    await page.waitForLoadState('load');

    // Verify "Kanskje" is now active
    await expect(maybeButton).toBeVisible();
    await expect(maybeButton).toHaveAttribute('data-active', 'true');
    await expect(goingButton).toHaveAttribute('data-active', 'false');

    // Change to "Kommer ikke"
    const notGoingButton = page.getByRole('button', {
      name: 'Kommer ikke',
      exact: true,
    });
    await notGoingButton.click();
    await expect(page.getByTestId('rsvp-feedback-panel')).toContainText(
      'Svar oppdatert',
    );
    await page.waitForLoadState('load');

    // Verify "Kommer ikke" is now active
    await expect(notGoingButton).toBeVisible();
    await expect(notGoingButton).toHaveAttribute('data-active', 'true');
    await expect(maybeButton).toHaveAttribute('data-active', 'false');
  });

  test('should not show RSVP buttons for tidligere arrangementer', async ({
    page,
  }) => {
    // Get the authenticated user's Clerk ID and ensure they exist in the database
    await gotoWithRetry(page, '/');
    await page.waitForLoadState('networkidle');

    const clerkUserId = await page.evaluate(async () => {
      const response = await fetch('/api/test/current-user');
      const data = await response.json();
      if (response.status === 404 && data.userId) {
        return data.userId;
      }
      if (response.ok) {
        return data.clerkUserId;
      }
      throw new Error(`Unexpected response: ${response.status}`);
    });

    // Ensure the authenticated user exists in the database
    try {
      await createTestUser({
        clerkUserId,
        email: uniqueEmail('authenticated'),
        name: 'Authenticated Test User',
      });
    } catch (_error) {
      // User already exists, that's fine
    }

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 7); // 7 days ago

    const event = await createTestEvent({
      title: 'Past Test Event',
      description: 'This event has already passed',
      dateTime: pastDate,
      location: 'Test Location',
    });

    await gotoWithRetry(page, `/events/${event.id}`);

    // Verify RSVP buttons are NOT visible
    await expect(
      page.getByRole('button', { name: 'Kommer', exact: true }),
    ).not.toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Kanskje', exact: true }),
    ).not.toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Kommer ikke', exact: true }),
    ).not.toBeVisible();

    // Verify past event notice is shown
    await expect(
      page.locator('[data-test-id="past-event-notice"]'),
    ).toBeVisible();
    await expect(
      page.locator('[data-test-id="past-event-notice"]'),
    ).toContainText('Dette arrangementet er over');
  });

  test('should update RSVP counts after status change', async ({ page }) => {
    // Get the authenticated user's Clerk ID and ensure they exist in the database
    await gotoWithRetry(page, '/');
    await page.waitForLoadState('networkidle');

    const clerkUserId = await page.evaluate(async () => {
      const response = await fetch('/api/test/current-user');
      const data = await response.json();
      if (response.status === 404 && data.userId) {
        return data.userId;
      }
      if (response.ok) {
        return data.clerkUserId;
      }
      throw new Error(`Unexpected response: ${response.status}`);
    });

    // Ensure the authenticated user exists in the database
    try {
      await createTestUser({
        clerkUserId,
        email: uniqueEmail('authenticated'),
        name: 'Authenticated Test User',
      });
    } catch (_error) {
      // User already exists, that's fine
    }

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const event = await createTestEvent({
      title: 'Test RSVP Counts Event',
      description: 'Test event for RSVP counts',
      dateTime: futureDate,
      location: 'Test Location',
    });

    await gotoWithRetry(page, `/events/${event.id}`);

    // Initially, Kommer count should be 0
    const goingCount = page
      .locator('[data-test-id="rsvp-count-item"]')
      .filter({ hasText: 'Kommer' })
      .locator('[data-test-id="rsvp-count-value"]')
      .first();
    await expect(goingCount).toHaveText('0');

    // Click "Kommer"
    await page.getByRole('button', { name: 'Kommer', exact: true }).click();
    await page.waitForLoadState('load');

    // Kommer count should now be 1
    await expect(goingCount).toHaveText('1');

    // Change to "Kanskje"
    await page.getByRole('button', { name: 'Kanskje', exact: true }).click();
    await page.waitForLoadState('load');

    // Kommer count should be back to 0, Kanskje count should be 1
    await expect(goingCount).toHaveText('0');
    const maybeCount = page
      .locator('[data-test-id="rsvp-count-item"]')
      .filter({ hasText: 'Kanskje' })
      .locator('[data-test-id="rsvp-count-value"]')
      .first();
    await expect(maybeCount).toHaveText('1');
  });

  test('should display current user RSVP status prominently', async ({
    page,
  }) => {
    // Get the authenticated user's Clerk ID and ensure they exist in the database
    await gotoWithRetry(page, '/');
    await page.waitForLoadState('networkidle');

    const clerkUserId = await page.evaluate(async () => {
      const response = await fetch('/api/test/current-user');
      const data = await response.json();
      if (response.status === 404 && data.userId) {
        return data.userId;
      }
      if (response.ok) {
        return data.clerkUserId;
      }
      throw new Error(`Unexpected response: ${response.status}`);
    });

    // Ensure the authenticated user exists in the database
    try {
      await createTestUser({
        clerkUserId,
        email: uniqueEmail('authenticated'),
        name: 'Authenticated Test User',
      });
    } catch (_error) {
      // User already exists, that's fine
    }

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const event = await createTestEvent({
      title: 'Test Status Display Event',
      description: 'Test event for status display',
      dateTime: futureDate,
      location: 'Test Location',
    });

    const currentUserRsvp = page.locator('[data-test-id="current-user-rsvp"]');
    await gotoWithRetry(page, `/events/${event.id}`);
    try {
      await currentUserRsvp.waitFor({ state: 'visible', timeout: 10_000 });
    } catch (error) {
      throw new Error(
        `Timed out waiting for RSVP panel to become visible for authenticated user. Original error: ${String(error)}`,
      );
    }

    await expect(currentUserRsvp).toContainText('Ditt svar');
    await expect(currentUserRsvp).toContainText('Velg status:');
    await expect(
      currentUserRsvp.locator('[data-rsvp-button="true"][data-status="going"]'),
    ).toHaveAttribute('data-active', 'false');

    // RSVP "Kommer"
    await page.getByRole('button', { name: 'Kommer', exact: true }).click();
    await page.waitForLoadState('load');

    await expect(currentUserRsvp).toContainText('Ditt svar');
    await expect(
      currentUserRsvp.locator('[data-rsvp-button="true"][data-status="going"]'),
    ).toHaveAttribute('data-active', 'true');
  });
});
