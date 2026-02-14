import { test, expect } from './fixtures';
import { gotoWithRetry } from './helpers/navigation-helpers';

async function expectShellSpacing(
  shell: import('@playwright/test').Locator,
  expectedMarginTop: string,
): Promise<void> {
  await expect(shell).toBeVisible();

  const spacing = await shell.evaluate((element) => {
    const styles = window.getComputedStyle(element);
    return {
      marginTop: styles.marginTop,
      paddingLeft: styles.paddingLeft,
      paddingRight: styles.paddingRight,
    };
  });

  expect(spacing.marginTop).toBe(expectedMarginTop);
  expect(spacing.paddingLeft).toBe('0px');
  expect(spacing.paddingRight).toBe('0px');
}

test.describe('Spacing consistency - authenticated shells', () => {
  test('keeps shared shell spacing recipe on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const routes = [
      { path: '/', testId: 'homepage-shell' },
      { path: '/events/new', testId: 'new-event-shell' },
      { path: '/history', testId: 'history-shell' },
      { path: '/settings', testId: 'settings-shell' },
      { path: '/profile', testId: 'profile-page-shell' },
    ];

    for (const route of routes) {
      await gotoWithRetry(page, route.path);
      await expectShellSpacing(page.getByTestId(route.testId), '24px');
    }
  });

  test('keeps shared shell spacing recipe on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    const routes = [
      { path: '/', testId: 'homepage-shell' },
      { path: '/events/new', testId: 'new-event-shell' },
      { path: '/history', testId: 'history-shell' },
      { path: '/settings', testId: 'settings-shell' },
      { path: '/profile', testId: 'profile-page-shell' },
    ];

    for (const route of routes) {
      await gotoWithRetry(page, route.path);
      await expectShellSpacing(page.getByTestId(route.testId), '40px');
    }
  });
});

test.describe('Spacing consistency - auth wrappers @unauth', () => {
  test('keeps aligned top spacing on auth and access wrappers', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    const routes = [
      { path: '/sign-in', testId: 'sign-in-shell' },
      { path: '/sign-up', testId: 'sign-up-shell' },
      { path: '/access-denied', testId: 'access-denied-shell' },
    ];

    for (const route of routes) {
      await gotoWithRetry(page, route.path);
      await expectShellSpacing(page.getByTestId(route.testId), '40px');
    }
  });
});
