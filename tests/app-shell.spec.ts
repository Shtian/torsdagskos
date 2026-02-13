import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

async function openMobileMenuAndWait(page: Page) {
  const mobileNav = page.getByRole('navigation', { name: 'Mobilnavigasjon' });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.getByRole('button', { name: 'Meny' }).click();
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

test.describe('App Shell Layout', () => {
  test.use({ storageState: './playwright/.clerk/user.json' });

  test('renders header with shadcn components on authenticated page', async ({
    page,
  }) => {
    await page.goto('/');

    // Header should be visible and sticky (use role=banner to avoid dev toolbar headers)
    const header = page.getByRole('banner');
    await expect(header).toBeVisible();

    // Logo/title link should be present
    const logo = page
      .getByRole('banner')
      .getByRole('heading', { name: 'Torsdagskos', exact: true });
    await expect(logo).toBeVisible();
    await expect(logo.locator('..')).toHaveAttribute('href', '/');

    // Navigation links should be semantic anchors with unchanged destinations
    const nav = page.getByRole('navigation', { name: 'Hovednavigasjon' });
    await expect(nav).toBeVisible();

    const createEventBtn = page.getByRole('link', {
      name: 'Opprett arrangement',
    });
    await expect(createEventBtn).toBeVisible();
    await expect(createEventBtn).toHaveAttribute('href', '/events/new');

    const historyBtn = page.getByRole('link', { name: 'Min historikk' });
    await expect(historyBtn).toBeVisible();
    await expect(historyBtn).toHaveAttribute('href', '/history');

    const settingsBtn = page.getByRole('link', { name: 'Innstillinger' });
    await expect(settingsBtn).toBeVisible();
    await expect(settingsBtn).toHaveAttribute('href', '/settings');

    const accountButton = page.getByRole('button', { name: 'Konto meny' });
    await expect(accountButton).toBeVisible();
  });

  test('header is responsive at mobile breakpoint', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const header = page.getByRole('banner');
    await expect(header).toBeVisible();

    const createEventBtn = page.getByRole('button', { name: 'Opprett' });
    const menuButton = page.getByRole('button', { name: 'Meny' });
    await expect(createEventBtn).toBeVisible();
    await expect(menuButton).toBeVisible();

    const mobileNav = await openMobileMenuAndWait(page);
    await expect(
      mobileNav.getByRole('link', { name: 'Min historikk' }),
    ).toBeVisible();
    await expect(
      mobileNav.getByRole('link', { name: 'Innstillinger' }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Profil' })).toBeVisible();
  });

  test('header is responsive at desktop breakpoint', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    const header = page.getByRole('banner');
    await expect(header).toBeVisible();

    // Username text should be visible at desktop size
    const userInfo = page
      .getByRole('banner')
      .locator('#header-profile-trigger span')
      .nth(1);
    await expect(userInfo).toBeVisible();

    await expect(
      page.getByRole('navigation', { name: 'Hovednavigasjon' }),
    ).toBeVisible();
  });

  test('current route has persistent active indicator for header links', async ({
    page,
  }) => {
    await page.goto('/history');

    const activeLink = page.getByRole('link', { name: 'Min historikk' });
    await expect(activeLink).toHaveAttribute('aria-current', 'page');
    await expect(activeLink).toHaveClass(/font-semibold/);

    const inactiveLink = page.getByRole('link', {
      name: 'Innstillinger',
    });
    await expect(inactiveLink).not.toHaveAttribute('aria-current', 'page');
  });

  test('header links show visible focus style for keyboard users', async ({
    page,
  }) => {
    await page.goto('/');

    const createEventLink = page.getByRole('link', {
      name: 'Opprett arrangement',
    });

    let isFocused = await createEventLink.evaluate(
      (element) => element === document.activeElement,
    );
    for (let index = 0; index < 12 && !isFocused; index += 1) {
      await page.keyboard.press('Tab');
      isFocused = await createEventLink.evaluate(
        (element) => element === document.activeElement,
      );
    }
    expect(isFocused).toBe(true);

    await expect(createEventLink).toHaveCSS('outline-style', 'solid');
    await expect(createEventLink).toHaveCSS('outline-width', '3px');
  });

  test('skip link is present for accessibility', async ({ page }) => {
    await page.goto('/');

    const skipLink = page.getByRole('link', { name: 'Hopp til hovedinnhold' });
    await expect(skipLink).toBeAttached();
    await expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  test('main content area has correct structure', async ({ page }) => {
    await page.goto('/');

    const main = page.locator('main#main-content');
    await expect(main).toBeVisible();
    await expect(main).toHaveClass(/flex-1/);
  });
});
