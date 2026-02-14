import type { Page, Response } from '@playwright/test';

export async function gotoWithRetry(
  page: Page,
  path: string,
): Promise<Response | null> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await page.goto(path, { waitUntil: 'domcontentloaded' });
    } catch (error) {
      if (attempt === 2) {
        throw error;
      }
      await page.waitForTimeout(300);
    }
  }

  throw new Error(`Navigation to "${path}" failed unexpectedly.`);
}
