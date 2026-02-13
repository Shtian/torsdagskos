import { test, expect } from './fixtures';
import type { Locator, Page } from '@playwright/test';
import { cleanupTestData, createEvent } from './helpers/api-helpers';

const MOBILE_VIEWPORT = { width: 375, height: 812 };
const TABLET_VIEWPORT = { width: 820, height: 1180 };

async function openMobileMenuAndWait(page: Page): Promise<Locator> {
  const mobileNav = page.getByRole('navigation', { name: 'Mobilnavigasjon' });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.getByRole('button', { name: 'Meny', exact: true }).click();
    try {
      await expect(mobileNav).toBeVisible({ timeout: 2000 });
      return mobileNav;
    } catch {
      // Retry to handle delayed hydration of the mobile React island.
    }
  }

  await expect(mobileNav).toBeVisible();
  return mobileNav;
}

async function gotoWithRetry(page: Page, path: string): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      return;
    } catch (error) {
      if (attempt === 2) {
        throw error;
      }
      await page.waitForTimeout(300);
    }
  }
}

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

  test('mobile homepage keeps navigation touch-friendly and avoids horizontal scroll', async ({
    page,
  }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);

    await createEvent(page, {
      title: `Mobile Card Event ${Date.now()}`,
      description: 'Event used to verify card rendering on small screens',
      dateTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      location: 'Compact Venue',
    });

    await gotoWithRetry(page, '/');

    const createEventButton = page.getByRole('button', {
      name: 'Opprett',
    });
    const menuButton = page.getByRole('button', { name: 'Meny', exact: true });

    await expect(createEventButton).toBeVisible();
    await expect(menuButton).toBeVisible();
    await expectTouchTarget(createEventButton);
    await expectTouchTarget(menuButton);

    const mobileNav = await openMobileMenuAndWait(page);
    const historyLink = mobileNav.getByRole('link', { name: 'Min historikk' });
    const settingsLink = mobileNav.getByRole('link', { name: 'Innstillinger' });
    const profileLink = page.getByRole('link', { name: 'Profil' });

    await expect(historyLink).toBeVisible();
    await expect(settingsLink).toBeVisible();
    await expect(profileLink).toBeVisible();

    await expectTouchTarget(historyLink);
    await expectTouchTarget(settingsLink);
    await expectTouchTarget(profileLink);
    await page.getByRole('button', { name: 'Lukk meny' }).click();
    await expect(mobileNav).toBeHidden();

    await expect(
      page.getByRole('heading', { name: /kommende arrangementer/i }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.getByRole('heading', { name: /Mobile Card Event/ }).click();
    await expect(page).toHaveURL(/\/events\/\d+$/);
    await expectNoHorizontalOverflow(page);
  });

  test('mobile event forms keep 16px inputs and preserve usable action buttons', async ({
    page,
  }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);

    await gotoWithRetry(page, '/events/new');

    await expect(
      page.getByRole('heading', {
        name: /opprett nytt arrangement/i,
        level: 1,
      }),
    ).toBeVisible();

    const titleInput = page.locator('#title');
    const dateInput = page.locator('#date');
    const timeInput = page.locator('#time');
    const submitButton = page.getByRole('button', {
      name: 'Opprett arrangement',
    });
    const cancelLink = page.getByRole('link', { name: 'Avbryt' });

    const titleFontSize = await titleInput.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).fontSize),
    );

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

    await gotoWithRetry(page, `/events/${eventId}/edit`);

    const saveButton = page.getByRole('button', { name: 'Lagre endringer' });
    const editCancelLink = page.getByRole('link', { name: 'Avbryt' });

    await expect(saveButton).toBeVisible();
    await expect(editCancelLink).toBeVisible();
    await expectTouchTarget(saveButton);
    await expectTouchTarget(editCancelLink);
    await expectNoHorizontalOverflow(page);
  });

  test('tablet viewport keeps key pages readable without overflow', async ({
    page,
  }) => {
    await page.setViewportSize(TABLET_VIEWPORT);

    await gotoWithRetry(page, '/settings');
    await expect(
      page.getByRole('heading', { name: 'Innstillinger', level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /be om varslingstillatelse/i }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await gotoWithRetry(page, '/history');
    await expect(
      page.getByRole('heading', { name: 'Min svarhistorikk', level: 1 }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await gotoWithRetry(page, '/events/new');
    await expect(
      page.getByRole('heading', {
        name: /opprett nytt arrangement/i,
        level: 1,
      }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
