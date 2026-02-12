import { test, expect } from './fixtures';

test.describe('Event Creation', () => {
  test('should display event creation form', async ({ page }) => {
    await page.goto('/events/new');

    // Check that form elements are visible
    await expect(page.getByTestId('new-event-shell')).toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: /opprett nytt arrangement/i,
        level: 1,
      }),
    ).toBeVisible();
    await expect(page.locator('#event-form[data-slot="card"]')).toBeVisible();
    await expect(page.locator('[data-slot="card-header"]')).toBeVisible();
    await expect(page.locator('[data-slot="card-content"]')).toBeVisible();
    await expect(page.locator('[data-slot="card-footer"]')).toBeVisible();
    await expect(page.locator('[data-slot="label"]').first()).toBeVisible();
    await expect(page.locator('#title[data-slot="input"]')).toBeVisible();
    await expect(
      page.locator('#description[data-slot="textarea"]'),
    ).toBeVisible();
    await expect(page.locator('#title')).toBeVisible();
    await expect(page.locator('#description')).toBeVisible();
    await expect(page.locator('#date')).toBeVisible();
    await expect(page.locator('#time')).toBeVisible();
    await expect(page.locator('#location')).toBeVisible();
    await expect(page.locator('#mapLink')).toBeVisible();
    await expect(
      page.getByRole('button', { name: /opprett arrangement/i, exact: true }),
    ).toBeVisible();
  });

  test('should show loading and disabled submit state while creating event', async ({
    page,
  }) => {
    await page.goto('/events/new');

    await page.route('**/api/events/create', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await page.locator('#title').fill('Loading State Event');
    await page.locator('#date').fill('2026-12-31');
    await page.locator('#time').fill('19:00');
    await page.locator('#location').fill('Loading Test Location');

    await page
      .getByRole('button', { name: /opprett arrangement/i, exact: true })
      .click();

    await expect(
      page.getByRole('button', { name: /oppretter\.\.\./i, exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole('button', { name: /oppretter\.\.\./i, exact: true }),
    ).toHaveAttribute('aria-busy', 'true');
    await expect(page.getByTestId('form-feedback-panel')).toBeVisible();
    await expect(page.getByTestId('form-feedback-panel')).toContainText(
      /oppretter arrangement/i,
    );
  });

  test('should show validation for required fields', async ({ page }) => {
    await page.goto('/events/new');

    // Try to submit without filling required fields
    await page
      .getByRole('button', { name: /opprett arrangement/i, exact: true })
      .click();

    // Browser should show validation errors (HTML5 validation)
    // We can't directly check the browser's validation UI, but we can check that form didn't submit
    // by checking we're still on the same page
    await expect(page).toHaveURL(/\/events\/new/);
  });

  test('should create event with all fields and redirect to detail page', async ({
    page,
  }) => {
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
    await page
      .getByRole('button', { name: /opprett arrangement/i, exact: true })
      .click();

    // Wait for success feedback
    await expect(page.getByTestId('form-feedback-panel')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByTestId('form-feedback-panel')).toContainText(
      /arrangement opprettet/i,
    );

    // Wait for redirect to event detail page (URL pattern)
    await page.waitForURL(/\/events\/\d+$/, { timeout: 10000 });

    // Verify we're on the event detail page with correct content
    await expect(
      page.getByRole('heading', { name: eventTitle, level: 1 }),
    ).toBeVisible();
    await expect(page.getByText(eventDescription)).toBeVisible();
    await expect(page.getByText(eventLocation)).toBeVisible();
    await expect(
      page.getByRole('link', { name: /åpne i kart/i }),
    ).toBeVisible();
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
    await page
      .getByRole('button', { name: /opprett arrangement/i, exact: true })
      .click();

    // Wait for redirect to event detail page (URL pattern)
    await page.waitForURL(/\/events\/\d+$/, { timeout: 10000 });

    // Verify event was created with only required fields
    await expect(
      page.getByRole('heading', { name: eventTitle, level: 1 }),
    ).toBeVisible();
    await expect(page.getByText(eventLocation)).toBeVisible();

    // Map link should not be present
    await expect(
      page.getByRole('link', { name: /åpne i kart/i }),
    ).not.toBeVisible();
  });

  test('should have Opprett arrangement button in header on homepage', async ({
    page,
  }) => {
    await page.goto('/');

    // Check that Opprett arrangement button is visible in header
    await expect(
      page.getByRole('link', { name: /opprett arrangement/i }),
    ).toBeVisible();
  });

  test('should navigate to event creation page from header button', async ({
    page,
  }) => {
    await page.goto('/');

    // Click Opprett arrangement button
    await page.getByRole('link', { name: /opprett arrangement/i }).click();

    // Should navigate to event creation page
    await expect(page).toHaveURL('/events/new');
    await expect(
      page.getByRole('heading', {
        name: /opprett nytt arrangement/i,
        level: 1,
      }),
    ).toBeVisible();
  });

  test('should allow canceling event creation', async ({ page }) => {
    await page.goto('/events/new');

    // Fill some fields
    await page.locator('#title').fill('Test Event');

    // Click Cancel button
    await page.getByRole('link', { name: /avbryt/i }).click();

    // Should navigate back to homepage
    await expect(page).toHaveURL('/');
  });

  test('should show error message on API failure', async ({ page }) => {
    await page.goto('/events/new');

    // Mock API to return error
    await page.route('**/api/events/create', (route) => {
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
    await page
      .getByRole('button', { name: /opprett arrangement/i, exact: true })
      .click();

    // Should show inline error feedback and restore submit state
    await expect(page.getByTestId('form-feedback-panel')).toBeVisible();
    await expect(page.getByTestId('form-feedback-panel')).toContainText(
      /internal server error/i,
    );
    await expect(
      page.getByRole('button', { name: /opprett arrangement/i, exact: true }),
    ).toBeEnabled();
  });

  test('should display newly created event on homepage', async ({ page }) => {
    const eventTitle = `Homepage Test Event ${Date.now()}`;

    await page.goto('/events/new');

    // opprett arrangement
    await page.locator('#title').fill(eventTitle);
    await page.locator('#date').fill('2026-12-31');
    await page.locator('#time').fill('19:00');
    await page.locator('#location').fill('Test Location');

    // Submit the form
    await page
      .getByRole('button', { name: /opprett arrangement/i, exact: true })
      .click();

    // Wait for redirect to event detail page
    await page.waitForURL(/\/events\/\d+$/, { timeout: 10000 });

    // Navigate to homepage
    await page.goto('/');

    // Should see the new event in upcoming events
    await expect(
      page.getByRole('heading', { name: eventTitle, level: 2 }),
    ).toBeVisible();
  });
});
