import { test, expect } from './fixtures';
import type { Locator, Page } from '@playwright/test';
import { cleanupTestData, createEvent } from './helpers/api-helpers';

const MOBILE_VIEWPORT = { width: 375, height: 812 };
const TABLET_VIEWPORT = { width: 820, height: 1180 };

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const metrics = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));

  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth);
  expect(metrics.bodyWidth).toBeLessThanOrEqual(metrics.viewportWidth);
}

async function expectTouchTarget(locator: Locator): Promise<void> {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();

  if (!box) {
    return;
  }

  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
}

test.describe('Responsive mobile and tablet polish', () => {
  test.beforeEach(async () => {
    await cleanupTestData();
  });

  test('mobile homepage keeps navigation touch-friendly and avoids horizontal scroll', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);

    await createEvent(page, {
      title: `Mobile Card Event ${Date.now()}`,
      description: 'Event used to verify card rendering on small screens',
      dateTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      location: 'Compact Venue',
    });

    await page.goto('/');

    const createEventLink = page.getByRole('link', { name: '+ Opprett arrangement' });
    const historyLink = page.getByRole('link', { name: 'Min historikk' });
    const settingsLink = page.getByRole('link', { name: 'Innstillinger' });
    const signOutButton = page.getByRole('button', { name: 'Logg ut' });

    await expect(createEventLink).toBeVisible();
    await expect(historyLink).toBeVisible();
    await expect(settingsLink).toBeVisible();
    await expect(signOutButton).toBeVisible();

    await expectTouchTarget(createEventLink);
    await expectTouchTarget(historyLink);
    await expectTouchTarget(settingsLink);
    await expectTouchTarget(signOutButton);

    await expect(page.getByRole('heading', { name: /kommende arrangementer/i })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.getByRole('heading', { name: /Mobile Card Event/ }).click();
    await expect(page).toHaveURL(/\/events\/\d+$/);
    await expectNoHorizontalOverflow(page);
  });

  test('mobile event forms keep 16px inputs and preserve usable action buttons', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);

    await page.goto('/events/new');

    await expect(page.getByRole('heading', { name: /opprett nytt arrangement/i, level: 1 })).toBeVisible();

    const titleInput = page.locator('#title');
    const dateInput = page.locator('#date');
    const timeInput = page.locator('#time');
    const submitButton = page.getByRole('button', { name: 'Opprett arrangement' });
    const cancelLink = page.getByRole('link', { name: 'Avbryt' });

    const titleFontSize = await titleInput.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));

    expect(titleFontSize).toBeGreaterThanOrEqual(16);
    await expect(dateInput).toHaveAttribute('type', 'date');
    await expect(timeInput).toHaveAttribute('type', 'time');

    await expectTouchTarget(submitButton);
    await expectTouchTarget(cancelLink);
    await expectNoHorizontalOverflow(page);

    const { eventId } = await createEvent(page, {
      title: `Editable Mobile Event ${Date.now()}`,
      description: 'Event for edit form responsive checks',
      dateTime: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      location: 'Edit Venue',
    });

    await page.goto(`/events/${eventId}/edit`);

    const saveButton = page.getByRole('button', { name: 'Lagre endringer' });
    const editCancelLink = page.getByRole('link', { name: 'Avbryt' });

    await expect(saveButton).toBeVisible();
    await expect(editCancelLink).toBeVisible();
    await expectTouchTarget(saveButton);
    await expectTouchTarget(editCancelLink);
    await expectNoHorizontalOverflow(page);
  });

  test('tablet viewport keeps key pages readable without overflow', async ({ page }) => {
    await page.setViewportSize(TABLET_VIEWPORT);

    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'Innstillinger', level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: /be om varslingstillatelse/i })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.goto('/history');
    await expect(page.getByRole('heading', { name: 'Min svarhistorikk', level: 1 })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.goto('/events/new');
    await expect(page.getByRole('heading', { name: /opprett nytt arrangement/i, level: 1 })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
