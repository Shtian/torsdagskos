import { test, expect } from './fixtures';

test.describe('App Shell Layout', () => {
  test.use({ storageState: './playwright/.clerk/user.json' });

  test('renders header with shadcn components on authenticated page', async ({ page }) => {
    await page.goto('/');

    // Header should be visible and sticky (use role=banner to avoid dev toolbar headers)
    const header = page.getByRole('banner');
    await expect(header).toBeVisible();

    // Logo/title link should be present
    const logo = page.getByRole('heading', { name: 'Torsdagskos' });
    await expect(logo).toBeVisible();
    await expect(logo.locator('..')).toHaveAttribute('href', '/');

    // Navigation buttons should use shadcn Button components
    const createEventBtn = page.getByRole('link', { name: '+ Create Event' });
    await expect(createEventBtn).toBeVisible();
    await expect(createEventBtn).toHaveAttribute('href', '/events/new');

    const historyBtn = page.getByRole('link', { name: 'My History' });
    await expect(historyBtn).toBeVisible();
    await expect(historyBtn).toHaveAttribute('href', '/history');

    const settingsBtn = page.getByRole('link', { name: 'Settings' });
    await expect(settingsBtn).toBeVisible();
    await expect(settingsBtn).toHaveAttribute('href', '/settings');

    const signOutBtn = page.getByRole('button', { name: 'Sign Out' });
    await expect(signOutBtn).toBeVisible();
  });

  test('header is responsive at mobile breakpoint', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const header = page.getByRole('banner');
    await expect(header).toBeVisible();

    // All navigation buttons should still be accessible
    await expect(page.getByRole('link', { name: '+ Create Event' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'My History' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign Out' })).toBeVisible();
  });

  test('header is responsive at desktop breakpoint', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    const header = page.getByRole('banner');
    await expect(header).toBeVisible();

    // User email should be visible at desktop size
    const userInfo = page.getByRole('banner').locator('span.text-muted-foreground');
    await expect(userInfo).toBeVisible();

    // All navigation should be in a single row
    const navContainer = page.getByRole('banner').locator('> div > div:last-child > div:last-child');
    await expect(navContainer).toBeVisible();
  });

  test('skip link is present for accessibility', async ({ page }) => {
    await page.goto('/');

    const skipLink = page.getByRole('link', { name: 'Skip to main content' });
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
