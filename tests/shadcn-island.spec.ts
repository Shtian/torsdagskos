import { test, expect } from './fixtures';

test.describe('shadcn react island', () => {
  test('renders the shadcn demo island on the homepage', async ({ page }) => {
    await page.goto('/');

    const island = page.getByTestId('shadcn-island');
    await expect(island).toBeVisible();

    // The island now uses tabs, verify tabs are present
    await expect(page.getByTestId('tabs-demo')).toBeVisible();
    await expect(page.getByTestId('tab-trigger-overview')).toBeVisible();
  });

  test('allows selecting a shadcn select option in the island', async ({ page }) => {
    await page.goto('/');

    // The select is now in the bottom section (outside tabs)
    // Wait for the island to be visible
    await expect(page.getByTestId('shadcn-island')).toBeVisible();

    // Find and interact with the select
    const selectTrigger = page.getByRole('combobox', { name: 'Shadcn status' });
    await expect(selectTrigger).toBeVisible();
    await expect(page.getByRole('button', { name: 'Shadcn Ready' })).toBeVisible();

    await selectTrigger.click();
    await page.getByRole('option', { name: 'In Progress' }).click();

    await expect(page.getByRole('button', { name: 'Shadcn Configured' })).toBeVisible();
  });
});
