import { test, expect } from './fixtures';

test.describe('typography fonts @unauth', () => {
  test('uses Manrope for body text and Lora for headings', async ({ page }) => {
    await page.goto('/access-denied');

    await expect(
      page.getByRole('heading', { name: 'Dette er en app kun for inviterte' }),
    ).toBeVisible();

    const typography = await page.evaluate(() => {
      const body = getComputedStyle(document.body);
      const heading = document.querySelector('h2');
      const headingStyle = heading ? getComputedStyle(heading) : null;

      return {
        bodyFontFamily: body.fontFamily,
        headingFontFamily: headingStyle?.fontFamily ?? '',
      };
    });

    expect(typography.bodyFontFamily).toContain('Manrope');
    expect(typography.headingFontFamily).toContain('Lora');
  });
});
