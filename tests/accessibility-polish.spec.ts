import { test, expect } from './fixtures';
import { createTestEvent } from './helpers/api-helpers';

test.describe('Accessibility polish', () => {
  test('should expose page titles and meta descriptions', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Events - Torsdagskos');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      /upcoming and past torsdagskos events/i
    );

    await page.goto('/settings');
    await expect(page).toHaveTitle('Settings - Torsdagskos');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      /manage browser notification permissions/i
    );
  });

  test('should support keyboard skip link and visible focus outlines', async ({ page }) => {
    await page.goto('/');

    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: /skip to main content/i });
    await expect(skipLink).toBeVisible();
    await expect(skipLink).toBeFocused();

    await page.keyboard.press('Tab');
    const focusDetails = await page.evaluate(() => {
      const active = document.activeElement as HTMLElement | null;
      if (!active) {
        return null;
      }

      const style = window.getComputedStyle(active);
      return {
        outlineStyle: style.outlineStyle,
        outlineWidth: Number.parseFloat(style.outlineWidth),
      };
    });

    expect(focusDetails).not.toBeNull();
    expect(focusDetails?.outlineStyle).not.toBe('none');
    expect(focusDetails?.outlineWidth ?? 0).toBeGreaterThanOrEqual(2);
  });

  test('should show loading and friendly error feedback when event creation fails', async ({ page }) => {
    await page.goto('/events/new');

    await page.route('**/api/events/create', async (route) => {
      await page.waitForTimeout(400);
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Event service is temporarily unavailable.' }),
      });
    });

    await page.locator('#title').fill(`A11y Loading Test ${Date.now()}`);
    await page.locator('#date').fill('2026-12-31');
    await page.locator('#time').fill('19:00');
    await page.locator('#location').fill('Test Venue');

    const submitButton = page.getByRole('button', { name: 'Create Event', exact: true });
    await submitButton.click();

    await expect(page.getByRole('button', { name: 'Creating...' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Creating...' })).toHaveAttribute('aria-busy', 'true');
    await expect(page.getByText('Creating event...')).toBeVisible();

    await expect(page.getByTestId('error-message')).toBeVisible();
    await expect(page.getByTestId('error-message')).toContainText(/failed to create event/i);
    await expect(page.getByText(/temporarily unavailable/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Event', exact: true })).toBeEnabled();
  });

  test('should show loading and inline error feedback when RSVP update fails', async ({ page }) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);

    const event = await createTestEvent({
      title: `RSVP Failure Test ${Date.now()}`,
      description: 'RSVP loading state test',
      dateTime: futureDate,
      location: 'Test Location',
    });

    await page.goto(`/events/${event.id}`);

    await page.route('**/api/rsvp', async (route) => {
      await page.waitForTimeout(400);
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'RSVP service unavailable' }),
      });
    });

    await page.getByRole('button', { name: 'Going', exact: true }).click();

    await expect(page.getByRole('button', { name: 'Saving...' })).toBeDisabled();
    await expect(page.getByText('Saving RSVP...')).toBeVisible();
    await expect(page.getByTestId('rsvp-error-message')).toBeVisible();
    await expect(page.locator('#rsvp-feedback')).toHaveText(/failed to update rsvp/i);
    await expect(page.getByRole('button', { name: 'Going', exact: true })).toBeEnabled();
  });

  test('should show loading and friendly feedback when settings update fails', async ({ page }) => {
    await page.addInitScript(() => {
      let permissionState = 'default';

      class MockNotification {
        static get permission() {
          return permissionState;
        }

        static async requestPermission() {
          permissionState = 'granted';
          return permissionState;
        }
      }

      Object.defineProperty(window, 'Notification', {
        configurable: true,
        writable: true,
        value: MockNotification,
      });
    });

    await page.goto('/settings');

    await page.route('**/api/settings/notifications', async (route) => {
      await page.waitForTimeout(400);
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unable to save notification preference' }),
      });
    });

    const actionButton = page.getByRole('button', { name: /request notification permission/i });
    await actionButton.click();

    await expect(page.getByRole('button', { name: 'Updating...' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Updating...' })).toHaveAttribute('aria-busy', 'true');
    await expect(page.locator('#feedback')).toHaveText(/updating notification settings/i);

    await expect(page.locator('#feedback')).toHaveText(/unable to save notification preference/i);
    await expect(page.getByRole('button', { name: /request notification permission/i })).toBeEnabled();
  });

  test('should keep key text color pairs at WCAG AA contrast levels', async ({ page }) => {
    await page.goto('/');

    const checks = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);

      const parseHex = (hex: string) => {
        const value = hex.trim();
        const normalized = value.startsWith('#') ? value.slice(1) : value;
        const isShort = normalized.length === 3;
        const full = isShort
          ? normalized.split('').map((c) => c + c).join('')
          : normalized;

        const int = Number.parseInt(full, 16);
        return {
          r: (int >> 16) & 255,
          g: (int >> 8) & 255,
          b: int & 255,
        };
      };

      const luminance = (hex: string) => {
        const { r, g, b } = parseHex(hex);
        const transform = (channel: number) => {
          const srgb = channel / 255;
          return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
        };

        return 0.2126 * transform(r) + 0.7152 * transform(g) + 0.0722 * transform(b);
      };

      const contrast = (foreground: string, background: string) => {
        const l1 = luminance(foreground);
        const l2 = luminance(background);
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
      };

      const pairs = [
        ['--color-text-primary', '--color-surface', 4.5],
        ['--color-text-secondary', '--color-surface', 4.5],
        ['--color-text-muted', '--color-surface', 4.5],
        ['#ffffff', '--color-accent', 4.5],
        ['#ffffff', '--color-success', 4.5],
        ['#ffffff', '--color-error', 4.5],
      ] as const;

      return pairs.map(([fg, bg, min]) => {
        const foreground = fg.startsWith('--') ? style.getPropertyValue(fg).trim() : fg;
        const background = bg.startsWith('--') ? style.getPropertyValue(bg).trim() : bg;
        return {
          fg,
          bg,
          ratio: contrast(foreground, background),
          min,
        };
      });
    });

    for (const check of checks) {
      expect(
        check.ratio,
        `Expected contrast ratio for ${check.fg} on ${check.bg} to be >= ${check.min}, got ${check.ratio.toFixed(2)}`
      ).toBeGreaterThanOrEqual(check.min);
    }
  });
});
