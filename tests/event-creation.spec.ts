import { test, expect } from './fixtures';

test.describe('Event Creation', () => {
  test('should display event creation form', async ({ page }) => {
    await page.goto('/events/new');

    // Check that form elements are visible
    await expect(page.getByRole('heading', { name: /create new event/i, level: 1 })).toBeVisible();
    await expect(page.locator('#title')).toBeVisible();
    await expect(page.locator('#description')).toBeVisible();
    await expect(page.locator('#date')).toBeVisible();
    await expect(page.locator('#time')).toBeVisible();
    await expect(page.locator('#location')).toBeVisible();
    await expect(page.locator('#mapLink')).toBeVisible();
    await expect(page.getByRole('button', { name: /create event/i, exact: true })).toBeVisible();
  });

  test('should show validation for required fields', async ({ page }) => {
    await page.goto('/events/new');

    // Try to submit without filling required fields
    await page.getByRole('button', { name: /create event/i, exact: true }).click();

    // Browser should show validation errors (HTML5 validation)
    // We can't directly check the browser's validation UI, but we can check that form didn't submit
    // by checking we're still on the same page
    await expect(page).toHaveURL(/\/events\/new/);
  });

  test('should create event with all fields and redirect to detail page', async ({ page }) => {
    await page.goto('/events/new');

    const eventTitle = `Test Event ${Date.now()}`;
    const eventDescription = 'This is a test event description';
    const eventLocation = 'Test Location';
    const eventMapLink = 'https://maps.google.com/test';

    // Fill out the form
    await page.locator('#title').fill(eventTitle);
    await page.locator('#description').fill(eventDescription);
    await page.locator('#date').fill('2026-12-31');
    await page.locator('#time').fill('19:00');
    await page.locator('#location').fill(eventLocation);
    await page.locator('#mapLink').fill(eventMapLink);

    // Submit the form
    await page.getByRole('button', { name: /create event/i, exact: true }).click();

    // Wait for success message
    await expect(page.locator('[data-test-id="success-message"]')).toBeVisible({ timeout: 10000 });

    // Wait for redirect to event detail page (URL pattern)
    await page.waitForURL(/\/events\/\d+$/, { timeout: 10000 });

    // Verify we're on the event detail page with correct content
    await expect(page.getByRole('heading', { name: eventTitle, level: 1 })).toBeVisible();
    await expect(page.getByText(eventDescription)).toBeVisible();
    await expect(page.getByText(eventLocation)).toBeVisible();
    await expect(page.getByRole('link', { name: /open in maps/i })).toBeVisible();
  });

  test('should create event without optional fields', async ({ page }) => {
    await page.goto('/events/new');

    const eventTitle = `Minimal Event ${Date.now()}`;
    const eventLocation = 'Minimal Location';

    // Fill only required fields
    await page.locator('#title').fill(eventTitle);
    await page.locator('#date').fill('2026-12-31');
    await page.locator('#time').fill('20:00');
    await page.locator('#location').fill(eventLocation);

    // Submit the form
    await page.getByRole('button', { name: /create event/i, exact: true }).click();

    // Wait for redirect to event detail page (URL pattern)
    await page.waitForURL(/\/events\/\d+$/, { timeout: 10000 });

    // Verify event was created with only required fields
    await expect(page.getByRole('heading', { name: eventTitle, level: 1 })).toBeVisible();
    await expect(page.getByText(eventLocation)).toBeVisible();

    // Map link should not be present
    await expect(page.getByRole('link', { name: /open in maps/i })).not.toBeVisible();
  });

  test('should have Create Event button in header on homepage', async ({ page }) => {
    await page.goto('/');

    // Check that Create Event button is visible in header
    await expect(page.getByRole('link', { name: /create event/i })).toBeVisible();
  });

  test('should navigate to event creation page from header button', async ({ page }) => {
    await page.goto('/');

    // Click Create Event button
    await page.getByRole('link', { name: /create event/i }).click();

    // Should navigate to event creation page
    await expect(page).toHaveURL('/events/new');
    await expect(page.getByRole('heading', { name: /create new event/i, level: 1 })).toBeVisible();
  });

  test('should allow canceling event creation', async ({ page }) => {
    await page.goto('/events/new');

    // Fill some fields
    await page.locator('#title').fill('Test Event');

    // Click Cancel button
    await page.getByRole('link', { name: /cancel/i }).click();

    // Should navigate back to homepage
    await expect(page).toHaveURL('/');
  });

  test('should show error message on API failure', async ({ page }) => {
    await page.goto('/events/new');

    // Mock API to return error
    await page.route('**/api/events/create', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    // Fill required fields
    await page.locator('#title').fill('Test Event');
    await page.locator('#date').fill('2026-12-31');
    await page.locator('#time').fill('19:00');
    await page.locator('#location').fill('Test Location');

    // Submit the form
    await page.getByRole('button', { name: /create event/i, exact: true }).click();

    // Should show error message
    await expect(page.locator('[data-test-id="error-message"]')).toBeVisible();
    await expect(page.locator('[data-test-id="error-message"]')).toHaveText(/failed to create event/i);
  });

  test('should display newly created event on homepage', async ({ page }) => {
    const eventTitle = `Homepage Test Event ${Date.now()}`;

    await page.goto('/events/new');

    // Create event
    await page.locator('#title').fill(eventTitle);
    await page.locator('#date').fill('2026-12-31');
    await page.locator('#time').fill('19:00');
    await page.locator('#location').fill('Test Location');

    // Submit the form
    await page.getByRole('button', { name: /create event/i, exact: true }).click();

    // Wait for redirect to event detail page
    await page.waitForURL(/\/events\/\d+$/, { timeout: 10000 });

    // Navigate to homepage
    await page.goto('/');

    // Should see the new event in upcoming events
    await expect(page.getByRole('heading', { name: eventTitle, level: 2 })).toBeVisible();
  });
});
