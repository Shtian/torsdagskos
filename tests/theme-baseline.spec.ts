import { test, expect } from './fixtures';

test.describe('theme baseline @unauth', () => {
  test('applies global light-theme tokens and baseline styles', async ({ page }) => {
    await page.goto('/access-denied');
    await expect(page.getByRole('heading', { name: 'This is an invite-only application' })).toBeVisible();

    const styles = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const body = getComputedStyle(document.body);
      const heading = document.querySelector('h2');
      const headingStyle = heading ? getComputedStyle(heading) : null;

      return {
        backgroundToken: root.getPropertyValue('--background').trim(),
        foregroundToken: root.getPropertyValue('--foreground').trim(),
        spacingToken: root.getPropertyValue('--space-4').trim(),
        radiusToken: root.getPropertyValue('--radius-md').trim(),
        shadowToken: root.getPropertyValue('--shadow-sm').trim(),
        bodyBackground: body.backgroundColor,
        bodyColor: body.color,
        headingFontFamily: headingStyle?.fontFamily ?? '',
      };
    });

    expect(styles.backgroundToken).toBe('#faf9f7');
    expect(styles.foregroundToken).toBe('#2d2d2d');
    expect(styles.spacingToken).toBe('1rem');
    expect(styles.radiusToken).toBe('0.5rem');
    expect(styles.shadowToken.length).toBeGreaterThan(0);

    expect(styles.bodyBackground).toBe('rgb(250, 249, 247)');
    expect(styles.bodyColor).toBe('rgb(45, 45, 45)');
    expect(styles.headingFontFamily).toContain('Georgia');
  });
});
