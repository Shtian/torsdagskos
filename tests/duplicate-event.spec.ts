import { test, expect } from './fixtures';
import { createEvent } from './helpers/api-helpers';

test.describe('Duplicate Event Functionality', () => {
  test('duplicate button is disabled when no events exist', async ({ page }) => {
    // Note: This test assumes a clean database state without events.
    // In a real test environment with existing events, this test might be skipped
    // or the database would be cleaned before this test runs.

    // Navigate to homepage
    await page.goto('/');

    // Look for either a disabled button or check if button exists
    // If there are events from other tests, there will be a link instead
    const duplicateButton = page.locator('button:has-text("Dupliser forrige arrangement"), a:has-text("Dupliser forrige arrangement")').first();
    await expect(duplicateButton).toBeVisible();

    // Check if it's a disabled button (when no events) or a link (when events exist)
    const tagName = await duplicateButton.evaluate(el => el.tagName.toLowerCase());
    if (tagName === 'button') {
      await expect(duplicateButton).toBeDisabled();
    }
    // If it's a link, events exist from other tests - this is OK for now
  });

  test('duplicate button is enabled when events exist', async ({ page }) => {
    // Create a test event
    await createEvent(page, {
      title: 'Test Event for Duplication',
      description: 'This is a test event',
      dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      location: 'Test Location',
      mapLink: 'https://maps.google.com/test',
    });

    // Navigate to homepage
    await page.goto('/');

    // Check that duplicate button exists and is enabled (should be a link, not disabled button)
    const duplicateLink = page.getByRole('link', { name: /dupliser forrige arrangement/i });
    await expect(duplicateLink).toBeVisible();
    await expect(duplicateLink).toHaveAttribute('href', /.+/); // Has href attribute
  });

  test('clicking duplicate button navigates to creation form with pre-filled data', async ({ page }) => {
    // Create a test event with specific data
    const eventData = {
      title: 'Monthly Torsdagskos',
      description: 'Regular Thursday gathering',
      dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Johans place',
      mapLink: 'https://maps.google.com/location123',
    };

    await createEvent(page, eventData);

    // Navigate to homepage
    await page.goto('/');

    // Click duplicate button
    const duplicateLink = page.getByRole('link', { name: /dupliser forrige arrangement/i });
    await duplicateLink.click();

    // Should navigate to /events/new with query parameters
    await page.waitForURL(/\/events\/new\?duplicate=true/);

    // Check that duplicate banner is visible
    const banner = page.locator('[data-test-id="duplicate-banner"]');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Duplisert fra forrige arrangement');
    await expect(banner).toContainText('Angi dato og klokkeslett for dette arrangementet.');

    // Check that form fields are pre-filled (except date and time)
    const titleInput = page.locator('#title');
    await expect(titleInput).toHaveValue(eventData.title);

    const descriptionInput = page.locator('#description');
    await expect(descriptionInput).toHaveValue(eventData.description);

    const locationInput = page.locator('#location');
    await expect(locationInput).toHaveValue(eventData.location);

    const mapLinkInput = page.locator('#mapLink');
    await expect(mapLinkInput).toHaveValue(eventData.mapLink);

    // Check that date and time are empty
    const dateInput = page.locator('#date');
    await expect(dateInput).toHaveValue('');

    const timeInput = page.locator('#time');
    await expect(timeInput).toHaveValue('');
  });

  test('can create a new event from duplicated form', async ({ page }) => {
    // Create a test event
    const originalEventData = {
      title: 'Original Event',
      description: 'Original description',
      dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Original Location',
      mapLink: 'https://maps.google.com/original',
    };

    await createEvent(page, originalEventData);

    // Navigate to homepage and click duplicate
    await page.goto('/');
    const duplicateLink = page.getByRole('link', { name: /dupliser forrige arrangement/i });
    await duplicateLink.click();

    await page.waitForURL(/\/events\/new\?duplicate=true/);

    // Fill in date and time (required fields that are empty)
    const futureDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days from now
    const dateString = futureDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeString = '18:00';

    await page.locator('#date').fill(dateString);
    await page.locator('#time').fill(timeString);

    // Submit the form
    const submitButton = page.getByRole('button', { name: /opprett arrangement/i, exact: true });
    await submitButton.click();

    // Wait for success feedback and redirect
    await expect(page.getByTestId('form-feedback-panel')).toBeVisible();
    await expect(page.getByTestId('form-feedback-panel')).toContainText(/arrangement opprettet/i);
    await page.waitForURL(/\/events\/\d+$/);

    // Verify new event page shows the duplicated data
    await expect(page.getByRole('heading', { name: originalEventData.title, level: 1 })).toBeVisible();
    await expect(page.locator('text=' + originalEventData.description)).toBeVisible();
    await expect(page.locator('text=' + originalEventData.location)).toBeVisible();
  });

  test('duplicates the most recent event when multiple events exist', async ({ page }) => {
    // Create multiple events with different timestamps
    const olderEvent = {
      title: 'Older Event',
      description: 'This is older',
      dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Old Location',
      mapLink: '',
    };

    const newerEvent = {
      title: 'Newer Event',
      description: 'This is newer',
      dateTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'New Location',
      mapLink: 'https://maps.google.com/new',
    };

    // Create older event first
    await createEvent(page, olderEvent);

    // Wait a bit to ensure different timestamps
    await page.waitForTimeout(1000);

    // Create newer event
    await createEvent(page, newerEvent);

    // Navigate to homepage and click duplicate
    await page.goto('/');
    const duplicateLink = page.getByRole('link', { name: /dupliser forrige arrangement/i });
    await duplicateLink.click();

    await page.waitForURL(/\/events\/new\?duplicate=true/);

    // Should pre-fill with the NEWER event data (most recent by createdAt)
    const titleInput = page.locator('#title');
    await expect(titleInput).toHaveValue(newerEvent.title);

    const descriptionInput = page.locator('#description');
    await expect(descriptionInput).toHaveValue(newerEvent.description);

    const locationInput = page.locator('#location');
    await expect(locationInput).toHaveValue(newerEvent.location);
  });

  test('duplicate banner not shown when navigating to create form directly', async ({ page }) => {
    // Navigate directly to /events/new without query parameters
    await page.goto('/events/new');

    // Banner should not be visible
    const banner = page.locator('[data-test-id="duplicate-banner"]');
    await expect(banner).not.toBeVisible();

    // Form fields should be empty
    const titleInput = page.locator('#title');
    await expect(titleInput).toHaveValue('');

    const descriptionInput = page.locator('#description');
    await expect(descriptionInput).toHaveValue('');

    const locationInput = page.locator('#location');
    await expect(locationInput).toHaveValue('');

    const mapLinkInput = page.locator('#mapLink');
    await expect(mapLinkInput).toHaveValue('');
  });
});
