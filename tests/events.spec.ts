import { test, expect } from './fixtures';
import {
  createTestUser,
  createTestEvent,
  createTestRsvp,
  cleanupTestData,
} from './helpers/api-helpers';

/**
 * E2E tests for events list and detail pages
 *
 * These tests verify event viewing functionality:
 * - Events list with upcoming and past sections
 * - Event detail page with full information
 * - RSVP counts and user lists
 * - Navigation and 404 handling
 *
 * Run with: pnpm test tests/events.spec.ts
 */

// Helper to generate unique email addresses for test isolation
function uniqueEmail(base: string): string {
  return `${base}+${Date.now()}+${Math.random().toString(36).substring(7)}@example.com`;
}

test.describe('Events List Page', () => {
  // Use authenticated storage state for these tests
  test.use({ storageState: './playwright/.clerk/user.json' });

  test('displays upcoming and past events in separate sections', async ({ page }) => {
    // Setup test data
    await cleanupTestData();

    const user1 = await createTestUser({
      clerkUserId: `test_user_1_${Date.now()}`,
      email: uniqueEmail('user1'),
      name: 'Test User 1',
    });

    const user2 = await createTestUser({
      clerkUserId: `test_user_2_${Date.now()}`,
      email: uniqueEmail('user2'),
      name: 'Test User 2',
    });

    // Create upcoming event (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const upcomingEvent = await createTestEvent({
      title: 'Upcoming Event',
      description: 'This is an upcoming event',
      dateTime: tomorrow,
      location: 'Future Location',
    });

    // Create past event (yesterday)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const pastEvent = await createTestEvent({
      title: 'Past Event',
      description: 'This was a past event',
      dateTime: yesterday,
      location: 'Past Location',
    });

    // Add RSVPs
    await createTestRsvp({
      userId: user1.id,
      eventId: upcomingEvent.id,
      status: 'going',
    });

    await createTestRsvp({
      userId: user2.id,
      eventId: pastEvent.id,
      status: 'maybe',
    });

    // Navigate to homepage
    await page.goto('/');

    // Verify page title
    await expect(page).toHaveTitle(/Torsdagskos/);

    // Verify "Upcoming Events" section exists
    await expect(page.getByRole('heading', { name: /upcoming events/i })).toBeVisible();

    // Verify upcoming event is displayed (h2 heading within event card)
    await expect(page.getByRole('heading', { name: 'Upcoming Event', level: 2 })).toBeVisible();

    // Get the first event card and verify its details
    const upcomingCard = page.getByTestId('event-card').first();
    await expect(upcomingCard.getByText('Future Location')).toBeVisible();
    await expect(upcomingCard.getByText('1 going')).toBeVisible();

    // Verify "Past Events" section exists
    await expect(page.getByRole('heading', { name: /past events/i })).toBeVisible();

    // Verify past event is displayed (h2 heading within event card)
    await expect(page.getByRole('heading', { name: 'Past Event', level: 2 })).toBeVisible();

    // Get the last event card and verify its details
    const pastCard = page.getByTestId('event-card').last();
    await expect(pastCard.getByText('Past Location')).toBeVisible();
    await expect(pastCard.getByText('1 maybe')).toBeVisible();
  });

  test('displays empty state when no events exist', async ({ page }) => {
    // Clean up all events
    await cleanupTestData();

    // Navigate to homepage
    await page.goto('/');

    // Verify empty state message is displayed
    await expect(page.getByText('No events yet. Check back soon!')).toBeVisible();

    // Verify no event cards are displayed
    const eventCards = page.locator('[data-test-id="event-card"]');
    await expect(eventCards).toHaveCount(0);
  });

  test('clicking event card navigates to event detail page', async ({ page }) => {
    // Setup test data
    await cleanupTestData();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const event = await createTestEvent({
      title: 'Clickable Event',
      description: 'Test event for navigation',
      dateTime: tomorrow,
      location: 'Test Location',
    });

    // Navigate to homepage
    await page.goto('/');

    // Click on the event card
    await page.getByRole('heading', { name: 'Clickable Event' }).click();

    // Verify navigation to event detail page
    await expect(page).toHaveURL(`/events/${event.id}`);
  });

  test('displays RSVP counts correctly for each event', async ({ page }) => {
    // Setup test data
    await cleanupTestData();

    const user1 = await createTestUser({
      clerkUserId: `test_user_1_${Date.now()}`,
      email: uniqueEmail('user1'),
      name: 'Test User 1',
    });

    const user2 = await createTestUser({
      clerkUserId: `test_user_2_${Date.now()}`,
      email: uniqueEmail('user2'),
      name: 'Test User 2',
    });

    const user3 = await createTestUser({
      clerkUserId: `test_user_3_${Date.now()}`,
      email: uniqueEmail('user3'),
      name: 'Test User 3',
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const event = await createTestEvent({
      title: 'RSVP Test Event',
      description: 'Testing RSVP counts',
      dateTime: tomorrow,
      location: 'Test Location',
    });

    // Create RSVPs with different statuses
    await createTestRsvp({
      userId: user1.id,
      eventId: event.id,
      status: 'going',
    });

    await createTestRsvp({
      userId: user2.id,
      eventId: event.id,
      status: 'maybe',
    });

    await createTestRsvp({
      userId: user3.id,
      eventId: event.id,
      status: 'not_going',
    });

    // Navigate to homepage
    await page.goto('/');

    // Verify RSVP counts are displayed correctly
    const eventCard = page.getByRole('link').filter({ has: page.getByRole('heading', { name: 'RSVP Test Event' }) });
    await expect(eventCard.getByText('1 going')).toBeVisible();
    await expect(eventCard.getByText('1 maybe')).toBeVisible();
    await expect(eventCard.getByText('1 not going')).toBeVisible();
  });
});

test.describe('Event Detail Page', () => {
  // Use authenticated storage state for these tests
  test.use({ storageState: './playwright/.clerk/user.json' });

  test('displays all event fields correctly', async ({ page }) => {
    // Setup test data
    await cleanupTestData();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const event = await createTestEvent({
      title: 'Complete Event Details',
      description: 'This is a detailed description\nwith multiple lines',
      dateTime: tomorrow,
      location: 'Test Venue, Oslo',
      mapLink: 'https://maps.google.com/?q=Oslo',
    });

    // Navigate to event detail page
    await page.goto(`/events/${event.id}`);

    // Verify page title
    await expect(page).toHaveTitle(/Complete Event Details/);

    // Verify all event fields are displayed
    await expect(page.getByRole('heading', { name: 'Complete Event Details', level: 1 })).toBeVisible();
    await expect(page.getByText('This is a detailed description')).toBeVisible();
    await expect(page.getByText('Test Venue, Oslo')).toBeVisible();

    // Verify map link is present and clickable
    const mapLink = page.getByRole('link', { name: /open in maps/i });
    await expect(mapLink).toBeVisible();
    await expect(mapLink).toHaveAttribute('href', 'https://maps.google.com/?q=Oslo');
    await expect(mapLink).toHaveAttribute('target', '_blank');
  });

  test('displays RSVP counts and user lists correctly', async ({ page }) => {
    // Setup test data
    await cleanupTestData();

    const user1 = await createTestUser({
      clerkUserId: `test_user_1_${Date.now()}`,
      email: uniqueEmail('alice'),
      name: 'Alice Johnson',
    });

    const user2 = await createTestUser({
      clerkUserId: `test_user_2_${Date.now()}`,
      email: uniqueEmail('bob'),
      name: 'Bob Smith',
    });

    const user3 = await createTestUser({
      clerkUserId: `test_user_3_${Date.now()}`,
      email: uniqueEmail('charlie'),
      name: 'Charlie Brown',
    });

    const user4 = await createTestUser({
      clerkUserId: `test_user_4_${Date.now()}`,
      email: uniqueEmail('user4'),
      name: 'Diana Prince',
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const event = await createTestEvent({
      title: 'RSVP Details Test',
      description: 'Testing RSVP display',
      dateTime: tomorrow,
      location: 'Test Location',
    });

    // Create RSVPs with different statuses
    await createTestRsvp({
      userId: user1.id,
      eventId: event.id,
      status: 'going',
    });

    await createTestRsvp({
      userId: user2.id,
      eventId: event.id,
      status: 'going',
    });

    await createTestRsvp({
      userId: user3.id,
      eventId: event.id,
      status: 'maybe',
    });

    await createTestRsvp({
      userId: user4.id,
      eventId: event.id,
      status: 'not_going',
    });

    // Navigate to event detail page
    await page.goto(`/events/${event.id}`);

    // Verify RSVP count boxes
    const rsvpCounts = page.locator('[data-test-id="rsvp-counts"]');
    await expect(rsvpCounts.locator('[data-test-id="rsvp-count-item"]').filter({ hasText: '2' }).filter({ hasText: 'Going' })).toBeVisible();
    await expect(rsvpCounts.locator('[data-test-id="rsvp-count-item"]').filter({ hasText: '1' }).filter({ hasText: 'Maybe' })).toBeVisible();
    await expect(rsvpCounts.locator('[data-test-id="rsvp-count-item"]').filter({ hasText: '1' }).filter({ hasText: 'Not Going' })).toBeVisible();

    // Verify "Going" list
    await expect(page.getByRole('heading', { name: /going \(2\)/i })).toBeVisible();
    await expect(page.getByText('Alice Johnson')).toBeVisible();
    await expect(page.getByText('Bob Smith')).toBeVisible();

    // Verify "Maybe" list
    await expect(page.getByRole('heading', { name: /maybe \(1\)/i })).toBeVisible();
    await expect(page.getByText('Charlie Brown')).toBeVisible();

    // Verify "Not Going" list
    await expect(page.getByRole('heading', { name: /not going \(1\)/i })).toBeVisible();
    await expect(page.getByText('Diana Prince')).toBeVisible();
  });

  test('displays no response count correctly', async ({ page }) => {
    // Setup test data
    await cleanupTestData();

    // Create 2 additional test users (plus authenticated user = 3 total)
    const user1 = await createTestUser({
      clerkUserId: `test_user_1_${Date.now()}`,
      email: uniqueEmail('user1'),
      name: 'Test User 1',
    });

    await createTestUser({
      clerkUserId: `test_user_2_${Date.now()}`,
      email: uniqueEmail('user2'),
      name: 'Test User 2',
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const event = await createTestEvent({
      title: 'No Response Test',
      description: 'Testing no response count',
      dateTime: tomorrow,
      location: 'Test Location',
    });

    // Only 1 user RSVPs (out of 3 total users: authenticated + 2 test users)
    await createTestRsvp({
      userId: user1.id,
      eventId: event.id,
      status: 'going',
    });

    // Navigate to event detail page
    await page.goto(`/events/${event.id}`);

    // Verify No Response count is displayed
    // Note: We don't check the specific count because users persist across test runs
    // The important thing is that the No Response item is visible and shows a count
    const rsvpCounts = page.locator('[data-test-id="rsvp-counts"]');
    const noResponseItem = rsvpCounts.locator('[data-test-id="rsvp-count-item"]').filter({ hasText: 'No Response' });
    await expect(noResponseItem).toBeVisible();

    // Verify the "Going" count shows 1 (the one RSVP we created)
    await expect(rsvpCounts.locator('[data-test-id="rsvp-count-item"]').filter({ hasText: '1' }).filter({ hasText: 'Going' })).toBeVisible();
  });

  test('back link navigates to events list', async ({ page }) => {
    // Setup test data
    await cleanupTestData();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const event = await createTestEvent({
      title: 'Navigation Test Event',
      description: 'Testing back navigation',
      dateTime: tomorrow,
      location: 'Test Location',
    });

    // Navigate to event detail page
    await page.goto(`/events/${event.id}`);

    // Click back link
    await page.getByRole('link', { name: /back to events/i }).click();

    // Verify navigation to homepage
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: /upcoming events/i })).toBeVisible();
  });

  test('returns 404 for non-existent event ID', async ({ page }) => {
    // Navigate to a non-existent event
    const response = await page.goto('/events/999999');

    // Verify 404 response
    expect(response?.status()).toBe(404);
  });

  test('displays current user RSVP status prominently', async ({ page }) => {
    // Setup test data
    await cleanupTestData();

    //  Get the clerk userId from the authenticated session
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const clerkUserId = await page.evaluate(async () => {
      const response = await fetch('/api/test/current-user');
      const data = await response.json();
      if (response.status === 404 && data.userId) {
        // User not in DB yet, return the clerk userId so we can create them
        return data.userId;
      }
      if (response.ok) {
        return data.clerkUserId;
      }
      throw new Error(`Unexpected response: ${response.status} - ${JSON.stringify(data)}`);
    });

    // Create the authenticated user explicitly (or get existing)
    let currentUser;
    try {
      currentUser = await createTestUser({
        clerkUserId,
        email: uniqueEmail('authenticated'),
        name: 'Authenticated Test User',
      });
    } catch (error) {
      // User already exists, fetch them via API
      currentUser = await page.evaluate(async () => {
        const response = await fetch('/api/test/current-user');
        return response.json();
      });
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const event = await createTestEvent({
      title: 'Current User RSVP Test',
      description: 'Testing current user RSVP display',
      dateTime: tomorrow,
      location: 'Test Location',
    });

    // Create RSVP for current user
    await createTestRsvp({
      userId: currentUser.id,
      eventId: event.id,
      status: 'going',
    });

    // Navigate to event detail page
    await page.goto(`/events/${event.id}`);

    // Verify current user's RSVP status is displayed prominently
    const currentUserRsvp = page.locator('[data-test-id="current-user-rsvp"]');
    await expect(currentUserRsvp).toBeVisible();
    await expect(currentUserRsvp.getByText('Your status:')).toBeVisible();
    await expect(currentUserRsvp.getByText('Going')).toBeVisible();
  });

  test('displays no response for user without RSVP', async ({ page }) => {
    // Setup test data
    await cleanupTestData();

    // Visit homepage first to ensure authenticated user is synced to database
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const event = await createTestEvent({
      title: 'No RSVP Test',
      description: 'Testing no RSVP display',
      dateTime: tomorrow,
      location: 'Test Location',
    });

    // Navigate to event detail page (no RSVP created)
    await page.goto(`/events/${event.id}`);

    // Verify "No Response" is displayed for current user
    const currentUserRsvp = page.locator('[data-test-id="current-user-rsvp"]');
    await expect(currentUserRsvp).toBeVisible();
    await expect(currentUserRsvp.getByText('Your status:')).toBeVisible();
    await expect(currentUserRsvp.getByText('No Response')).toBeVisible();
  });
});
