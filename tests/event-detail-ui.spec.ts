import { test, expect } from './fixtures';
import {
  createTestEvent,
  createTestRsvp,
  createTestUser,
  cleanupTestData,
} from './helpers/api-helpers';

function uniqueEmail(base: string): string {
  return `${base}+${Date.now()}+${Math.random().toString(36).slice(2)}@example.com`;
}

test.describe('Event Detail UI Migration', () => {
  test.use({ storageState: './playwright/.clerk/user.json' });

  test('renders migrated shadcn shell and actions for upcoming events', async ({
    page,
  }) => {
    await cleanupTestData();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const event = await createTestEvent({
      title: 'Migrated Detail Shell Event',
      description: 'Detail shell migration test description',
      dateTime: tomorrow,
      location: 'Oslo Test Venue',
      mapLink: 'https://maps.google.com/?q=Oslo',
    });

    await page.goto(`/events/${event.id}`);
    await expect(
      page.locator('[data-event-rsvp="true"][data-hydrated="true"]'),
    ).toBeVisible();

    await expect(page.getByTestId('event-detail-shell')).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: 'Migrated Detail Shell Event',
        level: 1,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'RSVP', level: 2 }),
    ).toBeVisible();

    const shell = page.getByTestId('event-detail-shell');
    await expect(shell.locator('[data-slot="card"]')).toHaveCount(1);
    await expect(
      page.getByRole('link', { name: /tilbake til arrangementer/i }),
    ).toHaveAttribute('href', '/');
    await expect(
      page.getByRole('link', { name: 'Rediger arrangement' }),
    ).toHaveAttribute('href', `/events/${event.id}/edit`);
    await expect(
      page.getByRole('link', { name: /åpne i kart/i }),
    ).toHaveAttribute('href', 'https://maps.google.com/?q=Oslo');

    await expect(
      page.getByRole('button', { name: 'Kommer', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Kanskje', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Kommer ikke', exact: true }),
    ).toBeVisible();
  });

  test('hides RSVP actions for past events and keeps migrated notice styling', async ({
    page,
  }) => {
    await cleanupTestData();

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const event = await createTestEvent({
      title: 'Past Migrated Detail Event',
      description: 'Past event detail migration test',
      dateTime: yesterday,
      location: 'Past Oslo Venue',
    });

    await page.goto(`/events/${event.id}`);

    await expect(
      page.getByRole('button', { name: 'Kommer', exact: true }),
    ).not.toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Kanskje', exact: true }),
    ).not.toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Kommer ikke', exact: true }),
    ).not.toBeVisible();
    await expect(page.getByTestId('past-event-notice')).toContainText(
      'Dette arrangementet er over',
    );
    await expect(
      page.getByRole('link', { name: 'Rediger arrangement' }),
    ).not.toBeVisible();
  });

  test('has no horizontal overflow on mobile viewport', async ({ page }) => {
    await cleanupTestData();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const event = await createTestEvent({
      title: 'Mobile Event Detail Shell',
      description: 'Mobile overflow guard',
      dateTime: tomorrow,
      location: 'Mobile Venue',
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/events/${event.id}`);

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasOverflow).toBe(false);
  });

  test('renders RSVP groups with correct users and counts', async ({
    page,
  }) => {
    await cleanupTestData();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const event = await createTestEvent({
      title: 'Detail RSVP Grouping Event',
      description: 'Validates grouped RSVP user rendering',
      dateTime: tomorrow,
      location: 'Oslo',
    });

    const goingUser = await createTestUser({
      clerkUserId: `detail-going-${Date.now()}`,
      email: uniqueEmail('detail-going'),
      name: 'Going User',
    });
    const maybeUser = await createTestUser({
      clerkUserId: `detail-maybe-${Date.now()}`,
      email: uniqueEmail('detail-maybe'),
      name: 'Maybe User',
    });
    const notGoingUser = await createTestUser({
      clerkUserId: `detail-not-going-${Date.now()}`,
      email: uniqueEmail('detail-not-going'),
      name: 'Not Going User',
    });
    const noResponseUser = await createTestUser({
      clerkUserId: `detail-no-response-${Date.now()}`,
      email: uniqueEmail('detail-no-response'),
      name: 'No Response User',
    });

    await createTestRsvp({
      eventId: event.id,
      userId: goingUser.id,
      status: 'going',
    });
    await createTestRsvp({
      eventId: event.id,
      userId: maybeUser.id,
      status: 'maybe',
    });
    await createTestRsvp({
      eventId: event.id,
      userId: notGoingUser.id,
      status: 'not_going',
    });

    await page.goto(`/events/${event.id}`);
    await expect(
      page.locator('[data-event-rsvp="true"][data-hydrated="true"]'),
    ).toBeVisible();

    await expect(
      page.getByRole('heading', { name: 'Kommer (1)', level: 3 }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Kanskje (1)', level: 3 }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Kommer ikke (1)', level: 3 }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /Ingen respons \(\d+\)/, level: 3 }),
    ).toBeVisible();

    await expect(page.getByText(goingUser.name, { exact: true })).toBeVisible();
    await expect(page.getByText(maybeUser.name, { exact: true })).toBeVisible();
    await expect(
      page.getByText(notGoingUser.name, { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(noResponseUser.name, { exact: true }),
    ).toBeVisible();
  });
});
