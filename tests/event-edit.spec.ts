import { test, expect } from './fixtures';
import {
  cleanupTestData,
  createEvent,
  createTestEvent,
} from './helpers/api-helpers';

function toOsloDateInputValue(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Oslo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  return `${year}-${month}-${day}`;
}

function toOsloTimeInputValue(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Oslo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const hour = parts.find((part) => part.type === 'hour')?.value;
  const minute = parts.find((part) => part.type === 'minute')?.value;

  return `${hour}:${minute}`;
}

test.describe('Event Edit', () => {
  test.beforeEach(async () => {
    await cleanupTestData();
  });

  test('shows Rediger arrangement button on upcoming event detail page', async ({
    page,
  }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { eventId } = await createEvent(page, {
      title: `Upcoming Event ${Date.now()}`,
      description: 'Upcoming event description',
      dateTime: tomorrow.toISOString(),
      location: 'Upcoming location',
      mapLink: 'https://maps.google.com/?q=upcoming',
    });

    await page.goto(`/events/${eventId}`);

    await expect(
      page.getByRole('link', { name: 'Rediger arrangement' }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Rediger arrangement' }),
    ).toHaveAttribute('href', `/events/${eventId}/edit`);
  });

  test('prefills edit form with existing event data', async ({ page }) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);
    futureDate.setHours(18, 30, 0, 0);

    const title = `Editable Event ${Date.now()}`;
    const description = 'Original description';
    const location = 'Original location';
    const mapLink = 'https://maps.google.com/?q=original';

    const { eventId } = await createEvent(page, {
      title,
      description,
      dateTime: futureDate.toISOString(),
      location,
      mapLink,
    });

    await page.goto(`/events/${eventId}/edit`);

    await expect(page.getByTestId('edit-event-shell')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /rediger arrangement/i, level: 1 }),
    ).toBeVisible();
    await expect(page.locator('#event-form[data-slot="card"]')).toBeVisible();
    await expect(page.locator('[data-slot="card-header"]')).toBeVisible();
    await expect(page.locator('[data-slot="card-content"]')).toBeVisible();
    await expect(page.locator('[data-slot="card-footer"]')).toBeVisible();
    await expect(page.locator('#title[data-slot="input"]')).toBeVisible();
    await expect(
      page.locator('#description[data-slot="textarea"]'),
    ).toBeVisible();
    await expect(page.locator('#title')).toHaveValue(title);
    await expect(page.locator('#description')).toHaveValue(description);
    await expect(page.locator('#location')).toHaveValue(location);
    await expect(page.locator('#mapLink')).toHaveValue(mapLink);
    await expect(page.locator('#date')).toHaveValue(
      toOsloDateInputValue(futureDate),
    );
    await expect(page.locator('#time')).toHaveValue(
      toOsloTimeInputValue(futureDate),
    );
  });

  test('updates event and redirects to event detail page', async ({ page }) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    futureDate.setHours(19, 0, 0, 0);

    const { eventId } = await createEvent(page, {
      title: `Original Event ${Date.now()}`,
      description: 'Original description',
      dateTime: futureDate.toISOString(),
      location: 'Original location',
      mapLink: 'https://maps.google.com/?q=original',
    });

    const updatedTitle = `Updated Event ${Date.now()}`;
    const updatedDescription = 'Updated event description';
    const updatedLocation = 'Updated location';
    const updatedMapLink = 'https://maps.google.com/?q=updated';

    await page.goto(`/events/${eventId}/edit`);

    await page.locator('#title').fill(updatedTitle);
    await page.locator('#description').fill(updatedDescription);
    await page.locator('#location').fill(updatedLocation);
    await page.locator('#mapLink').fill(updatedMapLink);
    await page.locator('#date').fill('2026-12-24');
    await page.locator('#time').fill('20:15');

    await page.getByRole('button', { name: 'Lagre endringer' }).click();

    await expect(page.getByTestId('form-feedback-panel')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByTestId('form-feedback-panel')).toContainText(
      /arrangement oppdatert/i,
    );
    await page.waitForURL(`/events/${eventId}`, { timeout: 10000 });

    await expect(
      page.getByRole('heading', { name: updatedTitle, level: 1 }),
    ).toBeVisible();
    await expect(page.getByText(updatedDescription)).toBeVisible();
    await expect(page.getByText(updatedLocation)).toBeVisible();
    await expect(
      page.getByRole('link', { name: /åpne i kart/i }),
    ).toHaveAttribute('href', updatedMapLink);
  });

  test('shows loading and disabled submit state while saving changes', async ({
    page,
  }) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 4);

    const { eventId } = await createEvent(page, {
      title: `Loading Rediger arrangement ${Date.now()}`,
      description: 'Loading state description',
      dateTime: futureDate.toISOString(),
      location: 'Loading location',
      mapLink: 'https://maps.google.com/?q=loading-edit',
    });

    await page.goto(`/events/${eventId}/edit`);

    await page.route('**/api/events/update', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await page
      .locator('#title')
      .fill(`Loading Rediger arrangement Updated ${Date.now()}`);
    await page.getByRole('button', { name: 'Lagre endringer' }).click();

    await expect(
      page.getByRole('button', { name: /lagrer\.\.\./i, exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole('button', { name: /lagrer\.\.\./i, exact: true }),
    ).toHaveAttribute('aria-busy', 'true');
    await expect(page.getByTestId('form-feedback-panel')).toBeVisible();
    await expect(page.getByTestId('form-feedback-panel')).toContainText(
      /lagrer endringer i arrangement/i,
    );
    await expect(page.getByTestId('form-feedback-panel')).toContainText(
      /internal server error/i,
      { timeout: 10000 },
    );
    await expect(
      page.getByRole('button', { name: 'Lagre endringer', exact: true }),
    ).toBeEnabled();
  });

  test('redirects from edit page for past events and hides edit button', async ({
    page,
  }) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const pastEvent = await createTestEvent({
      title: `Past Event ${Date.now()}`,
      description: 'Past event',
      dateTime: yesterday,
      location: 'Past location',
      mapLink: 'https://maps.google.com/?q=past',
    });

    await page.goto(`/events/${pastEvent.id}`);
    await expect(
      page.getByRole('link', { name: 'Rediger arrangement' }),
    ).toHaveCount(0);

    await page.goto(`/events/${pastEvent.id}/edit`);
    await expect(page).toHaveURL(`/events/${pastEvent.id}`);
    await expect(
      page.getByRole('heading', { name: pastEvent.title, level: 1 }),
    ).toBeVisible();
  });
});
