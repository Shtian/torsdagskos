import { test, expect } from './fixtures';

test.describe('shadcn react island', () => {
  test('renders the shadcn demo island on the homepage', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByTestId('shadcn-island')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Shadcn Ready' })).toBeVisible();
  });
});
