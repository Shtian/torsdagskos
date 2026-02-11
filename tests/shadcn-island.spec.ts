import { test, expect } from './fixtures';

test.describe('shadcn react island', () => {
  test('renders the shadcn demo island on the homepage', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByTestId('shadcn-island')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Shadcn Ready' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Shadcn status' })).toBeVisible();
  });

  test('allows selecting a shadcn select option in the island', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('combobox', { name: 'Shadcn status' }).click();
    await page.getByRole('option', { name: 'In Progress' }).click();

    await expect(page.getByRole('button', { name: 'Shadcn Configured' })).toBeVisible();
  });
});
